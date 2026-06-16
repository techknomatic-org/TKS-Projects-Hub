# Stage 1: Build static assets
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

# Define build arguments
ARG VITE_API_URL
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_AZURE_REDIRECT_URI
ARG VITE_BYPASS_MICROSOFT_AUTH
ARG VITE_SOCKET_URL

# Set environment variables for the build command
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
ENV VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
ENV VITE_AZURE_REDIRECT_URI=${VITE_AZURE_REDIRECT_URI}
ENV VITE_BYPASS_MICROSOFT_AUTH=${VITE_BYPASS_MICROSOFT_AUTH}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

COPY . .
RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from Stage 1 to Nginx serve directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
