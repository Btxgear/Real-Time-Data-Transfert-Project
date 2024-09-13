FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install jsonwebtoken
RUN npm install uuid

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
