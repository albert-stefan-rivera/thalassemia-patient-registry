FROM node:20-alpine

# Create app directory
WORKDIR /app

# Ensure local node_modules binaries are available on PATH
ENV PATH /app/node_modules/.bin:$PATH

# Bind Vite to all interfaces and use the default dev port
ENV HOST 0.0.0.0
ENV PORT 5173

# Install dependencies first (cacheable layer)
COPY package*.json ./
RUN npm install --silent

# Copy app sources
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev"]

