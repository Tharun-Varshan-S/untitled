#!/bin/bash
set -e

# Usage: ./scripts/deploy.sh <NEW_IMAGE_TAG> <DOCKERHUB_USERNAME>

NEW_IMAGE_TAG=$1
DOCKERHUB_USERNAME=$2

if [ -z "$NEW_IMAGE_TAG" ] || [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "Usage: $0 <NEW_IMAGE_TAG> <DOCKERHUB_USERNAME>"
    exit 1
fi

echo "Starting deployment for tag: $NEW_IMAGE_TAG"

# Get current tag for rollback
if [ -f ".env" ]; then
    PREV_IMAGE_TAG=$(grep "^IMAGE_TAG=" .env | cut -d '=' -f2 || true)
fi

if [ -z "$PREV_IMAGE_TAG" ]; then
    PREV_IMAGE_TAG="latest"
fi

echo "Previous image tag (for rollback if needed): $PREV_IMAGE_TAG"

# Update or create .env with new tag
if [ -f ".env" ]; then
    # Remove existing IMAGE_TAG and DOCKERHUB_USERNAME lines
    sed -i '/^IMAGE_TAG=/d' .env
    sed -i '/^DOCKERHUB_USERNAME=/d' .env
fi

echo "IMAGE_TAG=$NEW_IMAGE_TAG" >> .env
echo "DOCKERHUB_USERNAME=$DOCKERHUB_USERNAME" >> .env

echo "Pulling new images..."
docker-compose pull backend worker ai-service frontend

echo "Deploying new containers..."
docker-compose up -d

echo "Waiting for services to start..."
sleep 20

# Health checks
HEALTHY=true

echo "Checking Backend Health..."
# Since docker-compose maps backend port 4000 to localhost 4000
if ! curl -s http://localhost:4000/api/v1/health > /dev/null && ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Backend health check failed!"
    HEALTHY=false
fi

# The ai-service isn't mapped to the host, but docker-compose up creates an internal network.
# To check from the host, we check its health status if defined in compose.
echo "Checking AI Service Health..."
AI_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' loglens-ai-service 2>/dev/null || echo '"unknown"')
if [ "$AI_STATUS" = '"unhealthy"' ]; then
    echo "❌ AI Service health check failed! (docker healthcheck)"
    HEALTHY=false
fi

echo "Checking Frontend Health..."
# Frontend is mapped to 3000
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend health check failed!"
    HEALTHY=false
fi

if [ "$HEALTHY" = true ]; then
    echo "✅ All services are healthy. Deployment successful."
    exit 0
else
    echo "⚠️ Health checks failed. Initiating rollback to $PREV_IMAGE_TAG..."
    
    # Rollback
    sed -i '/^IMAGE_TAG=/d' .env
    echo "IMAGE_TAG=$PREV_IMAGE_TAG" >> .env
    
    docker-compose up -d
    
    echo "Rollback completed. Marking deployment as failed."
    exit 1
fi
