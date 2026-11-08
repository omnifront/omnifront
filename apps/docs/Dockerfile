# Builds the documentation site and serves it with nginx.
#   docker build -f apps/docs/Dockerfile -t omnifront-docs .
#   docker run --rm -p 8080:80 omnifront-docs
# Serving under a sub-path (for example https://example.com/omnifront/):
#   docker build -f apps/docs/Dockerfile --build-arg DOCS_BASE=/omnifront/ -t omnifront-docs .
FROM node:24-alpine AS build
RUN npm install -g pnpm@12
WORKDIR /repo
COPY . .
# Only the docs and the packages it documents (the API reference is checked against their built types).
RUN pnpm install --frozen-lockfile --filter "@omnifront/docs..."
ARG DOCS_BASE=/
ENV DOCS_BASE=$DOCS_BASE
RUN pnpm --filter "@omnifront/docs..." run build

FROM nginx:1.27-alpine
COPY apps/docs/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/docs/.vitepress/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
