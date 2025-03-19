# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the ports used by Express
EXPOSE 3000

# Run the app with ts-node
CMD ["npx", "ts-node", "src/app.ts"]
