FROM node:18-alpine

# Install openssl for Prisma compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy dependency manifests and install packages
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy remaining source code
COPY . .

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
