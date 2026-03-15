# Docker Compose Conventions

Use Docker Compose for local development when `{{use_compose}}` is true.

---

## File Structure

1. **Split compose files by concern**:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base configuration — service definitions, networks, volumes |
| `docker-compose.override.yml` | Dev overrides — bind mounts, port forwarding, hot reload; auto-loaded in development |
| `docker-compose.prod.yml` | Production overrides — resource limits, restart policies, read-only filesystems |

To run production config:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

To run development config (override auto-merges):
```bash
docker compose up       # automatically merges docker-compose.override.yml
```

---

## Service Names

2. **Use lowercase, hyphenated service names** — `my-service`, not `myService` or `my_service`. Service names become hostnames on Docker networks; hyphens are valid in hostnames, underscores are not (RFC 952).

---

## Health Checks

3. **Define a `healthcheck` for every service that other services depend on**. Without health checks, `depends_on` only waits for the container to start, not for the service inside it to be ready.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

---

## depends_on

4. **Use `condition: service_healthy` not `condition: service_started`** (or the bare `depends_on: - postgres`):

```yaml
services:
  api:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

`service_started` only waits for the container process to launch — the database inside may not yet accept connections.

---

## Volumes

5. **Named volumes for persistent data** — bind mounts (`./data:/var/lib/postgresql/data`) are for source code in development. For databases and other stateful services, use named volumes:

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

Named volumes are managed by Docker, survive `docker compose down`, and are removed only with `docker compose down -v`.

---

## Networks

6. **Define explicit networks** — do not rely on the default network. Explicit networks give you control over which services can talk to each other.

```yaml
services:
  api:
    networks:
      - internal
      - external
  postgres:
    networks:
      - internal  # only accessible to api, not exposed

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

---

## Secrets and Environment Variables

7. **Environment variables from `.env` file** — never hardcode secrets in `docker-compose.yml`. Use a `.env` file (gitignored) and reference variables:

```yaml
services:
  api:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
```

`.env.example` (committed) documents required variables:
```
DATABASE_URL=postgres://user:password@postgres:5432/mydb
JWT_SECRET=change-me-in-production
```

---

## Resource Limits in Production

8. **Set resource limits in the production compose file** — unbounded containers on a shared host can starve other services.

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp
```

---

## Restart Policies

9. **Set restart policies for production**:

| Policy | When to use |
|--------|------------|
| `unless-stopped` | Most services — restart on crash, not on intentional stop |
| `always` | Critical services that should survive host restarts |
| `no` | Development — don't auto-restart |
| `on-failure` | Services that should restart only on non-zero exit code |

```yaml
services:
  api:
    restart: unless-stopped
```

---

## Full Example

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "{{expose_port}}:{{expose_port}}"
    environment:
      PORT: "{{expose_port}}"
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - internal

networks:
  internal:
    driver: bridge

volumes:
  postgres-data:
```

```yaml
# docker-compose.override.yml (dev only, auto-loaded)
services:
  api:
    build:
      target: builder       # use the builder stage for dev (has all deps)
    volumes:
      - ./src:/app/src      # bind mount source for hot reload
    command: ["npm", "run", "dev"]
    environment:
      NODE_ENV: development
```
