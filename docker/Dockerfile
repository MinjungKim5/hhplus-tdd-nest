#
# 👨‍👨‍👦‍👧💻 Dev phase
#
FROM node:18-alpine as dev

# 필요한 라이브러리 설치
RUN apk add --no-cache libc6-compat openssl

# pnpm 설치 및 활성화
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

# 앱 디렉토리 설정
WORKDIR /app

# package.json만 먼저 복사
COPY package.json ./

# pnpm 설치 (lockfile 생성)
RUN pnpm install

# 소스 코드 복사
COPY . .

# 권한 설정
RUN chown -R node:node /app

USER node

# 개발 모드로 실행
CMD ["pnpm", "start:dev"]

#
# 🖥️📲 Production-build phase
#
FROM node:18-alpine as build

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate
WORKDIR /app

# Set as production environment
ENV NODE_ENV production

# Copy source code with dev install
COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node . .

# Build nest-js project
RUN pnpm build
# Install only the production dependencies and prun store to optimize image size
RUN pnpm install --production && pnpm store prune

USER node

#
# 🚀 Production-deploy phase
#
FROM node:18-alpine as prod

WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

ENV NODE_ENV production

# Copy only the necessary files
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules

# Set Docker as non-root user
USER node

CMD ["node", "dist/main.js"]