# Build stage
FROM node:18-alpine AS build

ARG REACT_APP_API_URL=http://localhost:5001/api
ARG REACT_APP_SOCKET_URL=http://localhost:5001

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
# Protected by .dockerignore - excludes node_modules, .env, and sensitive files
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
