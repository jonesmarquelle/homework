# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy workspace package files (root + frontend)
COPY package.json ./
COPY frontend/assignment-editor/package.json ./frontend/assignment-editor/

# Install dependencies with Yarn (already available in node:20-alpine)
RUN yarn install

# Copy source code (excluding node_modules via .dockerignore)
COPY frontend/assignment-editor/src ./frontend/assignment-editor/src
COPY frontend/assignment-editor/public ./frontend/assignment-editor/public
COPY frontend/assignment-editor/index.html ./frontend/assignment-editor/
COPY frontend/assignment-editor/vite.config.ts ./frontend/assignment-editor/
COPY frontend/assignment-editor/tsconfig*.json ./frontend/assignment-editor/
COPY frontend/assignment-editor/eslint.config.js ./frontend/assignment-editor/

# Copy shared folder for type definitions
COPY shared ./shared

# Build the application from workspace
WORKDIR /app/frontend/assignment-editor
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/frontend/assignment-editor/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY frontend/assignment-editor/nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
