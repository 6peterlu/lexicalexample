FROM node:18-slim as base
RUN apt-get update && apt-get install -y git
WORKDIR /app
COPY generated/ generated/
COPY prisma/ prisma/
COPY public/ public/
COPY styles/ styles/
COPY cache/ cache/
COPY models/ models/
COPY apollo-client.ts .
COPY next-env.d.ts .
COPY next.config.js .
COPY tsconfig.json .
COPY .env.* .
COPY codegen.yml .
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY components/ components/
COPY hooks/ hooks/
COPY utils/ utils/
COPY pages/ pages/
ARG NEXT_PUBLIC_WEBSOCKET_ENDPOINT=ws://localhost:1234
RUN yarn build