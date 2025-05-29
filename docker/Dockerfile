#
# 👨‍👨‍👦‍👧💻 Dev phase
#
FROM node:22-alpine as dev

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

WORKDIR /app

# package.json만 먼저 복사
COPY --chown=node:node package.json ./

# pnpm 설치 (lockfile 생성)
RUN pnpm install

# 소스 코드 복사 (권한도 함께)
COPY --chown=node:node . .

# Prisma 클라이언트 생성
RUN pnpm prisma generate

USER node

CMD ["pnpm", "start:dev"]

#
# 🖥️📲 Production-build phase
#
FROM node:22-alpine as build

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate
WORKDIR /app

ENV NODE_ENV production

COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node --from=dev /app .

# Prisma 클라이언트 생성
RUN pnpm prisma generate
RUN pnpm build
RUN pnpm install --production && pnpm store prune

USER node

#
# 🚀 Production-deploy phase
#
FROM node:22-alpine as prod

WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

ENV NODE_ENV production

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules

USER node

CMD ["node", "dist/main.js"]