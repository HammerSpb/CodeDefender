FROM node:18-alpine

# Install required packages for Prisma
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package files
COPY package.json ./

# Install dependencies (without lockfile)
RUN pnpm install --no-frozen-lockfile

# Copy prisma files first (both root and src)
COPY prisma ./prisma/
COPY src/prisma ./src/prisma/

# Generate Prisma client
RUN pnpm prisma:generate

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

EXPOSE 3000

# Start the application
CMD ["pnpm", "start:prod"]
