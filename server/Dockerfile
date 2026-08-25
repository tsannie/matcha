# Update to Node 22
FROM node:22-alpine

WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm@10.15.1

# Copy package files strictly for caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy app source code
COPY . .

EXPOSE 5000

# Command to start
CMD ["pnpm", "nodemon", "index.js"]
