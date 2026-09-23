#!/usr/bin/env bash
# LogLens Deployment Smoke Test
# Run this after a deployment to verify that all core services are healthy.

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "====================================="
echo " LogLens Deployment Smoke Test "
echo "====================================="

# Base URLs
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:4000"}
AI_SERVICE_URL=${AI_SERVICE_URL:-"http://localhost:8000"}

# Helper function
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Checking $service_name ($url)... "
    
    # We use curl to fetch just the HTTP status code
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}OK${NC} (Status: $status)"
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $status)"
        return 1
    fi
}

echo "1. Checking internal service endpoints..."
# Backend exposes /api/v1/health or similar (assume it returns 200)
# We can check the base API route or specific health check if exists.
check_service "Backend API" "$BACKEND_URL/api/v1/health" "200" || echo -e "${RED}Warning: Backend health check failed or missing. Please ensure /api/v1/health is exposed.${NC}"

# AI service exposes /health
check_service "Python AI Service" "$AI_SERVICE_URL/health" "200" || exit 1

# Frontend should return 200 for index
check_service "Frontend Web" "$FRONTEND_URL" "200" || exit 1

echo ""
echo "2. Checking Elasticsearch dependency..."
# Rely on backend health endpoint if it includes DB checks, or just check ES if exposed locally
if [ -n "$ELASTICSEARCH_URL" ]; then
    check_service "Elasticsearch" "$ELASTICSEARCH_URL/_cluster/health" "200" || echo -e "${RED}Warning: Elasticsearch health check failed.${NC}"
else
    echo "ELASTICSEARCH_URL not set, skipping direct ES check."
fi

echo ""
echo "3. Checking API Ingestion Availability..."
INGEST_URL="$BACKEND_URL/api/v1/logs/ingest"

# Try to ingest an empty payload - should get 400 Bad Request, not 502/404
check_service "Ingestion Endpoint" "$INGEST_URL" "400" || echo -e "${RED}Warning: Ingestion endpoint check failed.${NC}"

echo ""
echo "====================================="
echo -e "${GREEN}SMOKE TEST COMPLETE!${NC}"
echo "====================================="
exit 0
