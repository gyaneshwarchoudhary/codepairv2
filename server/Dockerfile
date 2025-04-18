# File: CodePair/server/Dockerfile
FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install essential tools and compilers
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    python3 \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create temp directory for code execution
RUN mkdir -p temp

# Expose port
EXPOSE 5000
# Start command
CMD ["node", "index.js"]
