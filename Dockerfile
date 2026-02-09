FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN npx tsc -p tsconfig.migrations.json


FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


FROM node:20-alpine AS prod

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/migrations ./migrations

EXPOSE ${PORT}

CMD [ "npm", "run", "start:prod" ]
