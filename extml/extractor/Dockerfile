FROM node:22.14.0

WORKDIR /app
COPY . .

RUN npm install pnpm -g

RUN pnpm install
RUN pnpm playwright install --with-deps
RUN pnpm build

EXPOSE 5500

CMD ["pnpm", "start"]
