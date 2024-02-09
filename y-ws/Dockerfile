FROM node:18-slim as base
RUN apt-get update && apt-get install -y git
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn
