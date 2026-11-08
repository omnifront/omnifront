# Deploying the docs

The site is static. The `Dockerfile` in `apps/docs` builds it and serves it with nginx.

```bash
# from the repository root
docker compose -f apps/docs/deploy/docker-compose.yml up -d --build
# http://<server>:8080
```

- Port: `DOCS_PORT=9000 docker compose ... up -d --build`.
- Sub-path (for example behind a reverse proxy at `/unicore/`): `DOCS_BASE=/unicore/ docker compose ... up -d --build`.
- TLS: terminate it in your reverse proxy (Caddy, Traefik, nginx) in front of port 8080.
- Update: `git pull && docker compose -f apps/docs/deploy/docker-compose.yml up -d --build`.

The image is built from the repository (`COPY . .`), so build it from a clean checkout of the commit you want to publish.
