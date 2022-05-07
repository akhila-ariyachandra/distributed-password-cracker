FROM node:16

WORKDIR /usr/src/app

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

# Files required by pnpm install
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy all files
COPY . .

CMD [ "pnpm", "start" ]
