FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN yarn install --frozen-lockfile 2>/dev/null || yarn install

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY libs/ libs/
COPY apps/admin/ apps/admin/
COPY apps/loyalty-admin/ apps/loyalty-admin/
COPY apps/loyalty-consumer/ apps/loyalty-consumer/
COPY apps/product-admin/ apps/product-admin/
COPY apps/product-consumer/ apps/product-consumer/
COPY apps/user-admin/ apps/user-admin/
COPY apps/user-consumer/ apps/user-consumer/
COPY apps/redistro/ apps/redistro/

RUN yarn build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["/entrypoint.sh"]
