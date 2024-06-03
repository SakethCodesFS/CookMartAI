# Use a base image with Node.js
FROM node:14

# Install youtube-dl and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install youtube-dl \
    && rm -rf /var/lib/apt/lists/*

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build --prefix frontend

# Expose the port the app runs on
EXPOSE 5001

# Command to run the app
CMD ["node", "backend/server.js"]
