# Use a small, stable Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the project
COPY . .

# Ensure production mode
ENV NODE_ENV=production

# Start the bot
CMD ["npm", "run", "start"]
