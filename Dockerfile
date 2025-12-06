FROM node:20

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy all application files
COPY . .

# Build the React client
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the server port
EXPOSE 3004

# Start the server
CMD ["node", "src/server/server.js"]