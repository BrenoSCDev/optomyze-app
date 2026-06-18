# ── Stage 1: Build the React app ────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source code and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ───────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built files from Stage 1
# ⚠ Vite → change "dist" to the folder your build outputs to
# ⚠ CRA → change "dist" to "build"
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]