# Multi-stage Dockerfile for acquisitions app

# Base dependencies layer
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies using package-lock for reproducible builds
COPY package*.json ./
RUN npm ci

# Development image
FROM base AS development
ENV NODE_ENV=development
# Copy the rest of the source for live development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production image
FROM base AS production
ENV NODE_ENV=production
# Remove devDependencies
RUN npm prune --omit=dev
# Copy application source
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
