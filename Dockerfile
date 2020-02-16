FROM node:12.13.0-alpine

WORKDIR /opt

COPY . ./

RUN npm i --production 

ENTRYPOINT ["npm", "start"]

EXPOSE 8080