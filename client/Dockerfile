FROM node:22.14.0

WORKDIR /app
COPY . .

RUN npm install pnpm -g

RUN pnpm install
# RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "dev"]
