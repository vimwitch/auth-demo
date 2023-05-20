FROM node:18.15-buster-slim

COPY . /src

WORKDIR /src

RUN yarn && rm -rf packages/frontend

COPY ./node_modules/auth /src/node_modules/auth

WORKDIR /src/node_modules/auth

# hack to get a noop git command
RUN echo "#!/bin/sh" > /usr/bin/git && chmod +x /usr/bin/git
RUN yarn --production
RUN echo "module.exports = {}" > /src/node_modules/auth/config.js

FROM node:18.15-buster-slim

COPY --from=0 /src /src
WORKDIR /src/packages/relay

CMD ["node", "src/index.mjs"]
