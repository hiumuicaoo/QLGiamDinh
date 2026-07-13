# Multi-stage Docker build for React/Vite/Express application
# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy the entire source code
COPY . .

# Build both frontend static assets (dist/) and bundle backend server (dist/server.cjs)
RUN npm run build

# Stage 2: Install production-only dependencies to minimize the final image size
FROM node:20-alpine AS deps-cleaner

WORKDIR /app

COPY package*.json ./

# Install production-only node_modules
RUN npm ci --omit=dev

# Stage 3: Production environment runner
FROM node:20-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy production node_modules from deps-cleaner stage
COPY --from=deps-cleaner /app/node_modules ./node_modules
COPY --from=deps-cleaner /app/package.json ./package.json

# Copy static frontend assets and bundled backend files from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary directories for local dynamic Word template and data storage,
# then assign ownership to the pre-existing non-root 'node' user for security hardening
RUN mkdir -p /app/records /app/templates /app/templates/TRUONG_PHONG /app/templates/PHO_TRUONG_PHONG && \
    touch /app/dossiers.json && \
    chown -R node:node /app

# Switch to the non-root user
USER node

# Expose the application port (Express defaults to 3000)
EXPOSE 3000

# Start the Node.js application via pre-configured npm start script (runs node dist/server.cjs)
CMD ["npm", "start"]
