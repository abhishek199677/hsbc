FROM node:20-slim

# Install Python, Java, Go, and C++ compiler
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    default-jdk \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN curl -fsSL https://go.dev/dl/go1.22.0.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH=$PATH:/usr/local/go/bin

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .
RUN npx tsc

EXPOSE 8003
CMD ["node", "dist/server.js"]
