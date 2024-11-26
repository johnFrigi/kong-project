# Stage 1: Build
FROM node:22.11.0-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22.11.0-alpine AS run

WORKDIR /app

# Copy only the built output and package information
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/package-lock.json ./

# Install only production dependencies and rebuild native modules
RUN npm install --omit=dev

# Set the environment and expose necessary ports
ENV NODE_ENV=production
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start:prod"]
