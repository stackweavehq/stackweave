# Dockerfile Best Practices

Base image: **{{base_image}}**
Exposed port: **{{expose_port}}**
Registry: **{{registry}}**

---

## Multi-Stage Builds

1. **Always use multi-stage builds** — a single-stage Dockerfile that includes dev dependencies, source files, and build tooling will produce an unnecessarily large image that increases attack surface and pull times.

Standard two-stage pattern:

```dockerfile
# Stage 1: builder — install all deps and compile
FROM {{base_image}} AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runner — only production artifacts
FROM {{base_image}} AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
```

---

## Base Image

2. **Use `{{base_image}}`** as the base image for this project. Alpine variants are minimal (~5 MB); distroless images have no shell and are maximally secure (no `sh`, no `apt`).
3. **Pin versions with SHA digests** in production Dockerfiles — tags like `alpine` or `latest` can silently change:

```dockerfile
FROM {{base_image}}@sha256:<digest-here>
```

Find the digest with `docker pull {{base_image}} && docker inspect {{base_image}} --format='\{{.RepoDigests}}'`

---

## .dockerignore

4. **A `.dockerignore` file is required**. Without it, the entire build context is sent to the Docker daemon, including `node_modules/` (hundreds of MB), `.git/`, secrets, and build artifacts.

Minimum `.dockerignore`:

```
node_modules/
.git/
*.log
.env*
dist/
coverage/
.DS_Store
*.md
```

5. Never copy `.env*` files into the image — secrets belong in runtime environment variables, not image layers.

---

## Layer Caching

6. **Copy dependency manifests before source code** to maximise cache hit rate. The `npm install` layer is only invalidated when `package.json` or `package-lock.json` changes — not when source files change.

```dockerfile
# correct — cache deps layer when only source changed
COPY package*.json ./
RUN npm ci
COPY . .      # source changes only invalidate this layer and below

# wrong — invalidates cache on every source change
COPY . .
RUN npm ci
```

7. **Use `npm ci` not `npm install`** — `npm ci` installs exactly what is in `package-lock.json`, is faster, and fails if the lock file is out of sync.

---

## Non-Root User

8. **Run as a non-root user** — root inside a container has root-equivalent privileges on the host if the container is misconfigured. Always create and switch to a non-root user before `CMD`/`ENTRYPOINT`.

```dockerfile
# Create a non-root user and group
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

USER appuser
```

---

## Health Check

9. **A `HEALTHCHECK` instruction is required** — container orchestrators (Kubernetes, ECS, Docker Swarm) use the health check to know when a container is ready and whether it is alive.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:{{expose_port}}/health || exit 1
```

For Node.js apps, expose a `/health` endpoint that returns `200 OK` with `{ "status": "ok" }`.

---

## COPY vs ADD

10. **Use `COPY`, not `ADD`** — `ADD` has non-obvious behaviour: it auto-extracts archives and can fetch URLs, which makes Dockerfiles unpredictable. Use `COPY` for everything unless you specifically need archive extraction.

```dockerfile
# correct
COPY . .

# wrong — surprising behaviour with URLs and tarballs
ADD . .
```

---

## Single Process

11. **One process per container** — do not use process supervisors (supervisord, PM2) inside containers unless you have a documented reason. If you need sidecar processes, use separate containers in the same pod/service.

---

## Logging

12. **Log to stdout and stderr** — never write logs to files inside a container. Container orchestrators capture stdout/stderr and route them to logging infrastructure (CloudWatch, Loki, Datadog). Log files inside containers are invisible to the orchestrator and grow unboundedly.

---

## EXPOSE Instruction

13. **Include `EXPOSE {{expose_port}}`** for documentation and tooling — it tells `docker inspect`, Kubernetes, and IDE integrations which port the service uses. It does not publish the port; `docker run -p` does that.

```dockerfile
EXPOSE {{expose_port}}
```

---

## CMD Format

14. **Use exec form `["executable", "arg1"]` for `CMD` and `ENTRYPOINT`** — not shell form `executable arg1`. Shell form wraps the command in `sh -c`, which means signals (SIGTERM, SIGINT) are sent to the shell, not the process. This breaks graceful shutdown.

```dockerfile
# correct — exec form
CMD ["node", "dist/index.js"]

# wrong — shell form, signals go to sh
CMD node dist/index.js
```

---

## No Secrets in Dockerfile

15. **Never store secrets in Dockerfile instructions** — every `RUN`, `ENV`, and `ARG` with a secret value is baked into the image layer history, even after deletion. Use runtime environment variables or Docker secrets mounts.

```dockerfile
# WRONG — API key is permanently in image history
RUN npm config set //registry.npmjs.org/:_authToken=npm_secret

# CORRECT — pass as build secret (Docker BuildKit)
RUN --mount=type=secret,id=npm_token \
    npm config set //registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token) && \
    npm ci
```

---

## Example Complete Dockerfile

```dockerfile
FROM {{base_image}}@sha256:<pin-digest-here> AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM {{base_image}}@sha256:<pin-digest-here> AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE {{expose_port}}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:{{expose_port}}/health || exit 1

CMD ["node", "dist/index.js"]
```
