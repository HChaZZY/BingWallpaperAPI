FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/cache /app/logs && \
    chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "app.js"]