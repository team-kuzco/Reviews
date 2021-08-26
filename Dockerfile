FROM node:14
WORKDIR /Reviews
COPY package*.json /Reviews
RUN npm install
COPY . /Reviews
CMD exec node --experimental-modules server/index.js
EXPOSE 8082