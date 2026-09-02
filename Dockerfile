# Use a small, stable Node image
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Enable pnpm (version comes from packageManager in package.json)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Copy package files first (better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy the rest of the project
COPY . .

# Ensure production mode
ENV NODE_ENV=production

# Start the bot
CMD ["npm", "run", "start"]
