FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN cp src/config/schema.sql dist/config/schema.sql

EXPOSE 3000

CMD ["node", "dist/server.js"]
