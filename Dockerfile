FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Build the application
RUN npm run build:api

EXPOSE 3000

# Start in production mode
CMD ["npm", "start"]
