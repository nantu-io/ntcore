#
# App Dockerfile
# Version: 0.0.1
#
# Author: Jinxiong Tan
# Date: 2020-08-21

FROM node:14-alpine as BUILD_IMAGE

# Install python runtime
RUN apk update && \
    apk add python make g++ && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Build frontend assets
WORKDIR /usr/src/app/webapp
RUN npm install
RUN npm run build

# Build server artifact
WORKDIR /usr/src/app
RUN npm install
RUN npm run build

# Prune the npm dev packages
RUN npm prune --production

# Stage build
FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

# copy from build image
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/webapp/build ./webapp/build
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

EXPOSE 8180

CMD [ "npm", "run", "prod" ]