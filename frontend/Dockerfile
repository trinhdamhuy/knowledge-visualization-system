FROM node:20

WORKDIR /app

ARG AWS_ENDPOINT
ENV AWS_ENDPOINT=${AWS_ENDPOINT}

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm i --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npx prisma generate && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

