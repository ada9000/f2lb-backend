FROM node:14

RUN apt-get update -y
RUN apt-get install -y redis-server
RUN service redis-server start
WORKDIR /usr/src/f2lb-backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ./entry.sh