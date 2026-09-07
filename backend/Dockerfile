# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./backend/
# We need to run npm install in the backend directory
WORKDIR /app/backend
RUN npm ci

WORKDIR /app
# Copy source
COPY backend/ ./backend/
COPY shared/ ./shared/

WORKDIR /app/backend
# Build typescript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

WORKDIR /app
# Copy built files from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

# Switch to non-root user
RUN mkdir -p /app/backend/logs && chown -R node:node /app
USER node

WORKDIR /app/backend

EXPOSE 4000

CMD ["npm", "start"]
