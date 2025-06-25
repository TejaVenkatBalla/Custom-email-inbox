# Use official Node.js 18 Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose port 3000 for the dev server
EXPOSE 8080

# Start the development server
CMD ["npm", "run", "dev"]
