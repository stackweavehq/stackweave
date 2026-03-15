# Docker Compose Patterns Guide

Common patterns for local development and production Docker Compose configurations.

---

## Dev vs Prod Config Split

The base + override pattern keeps configs DRY while allowing environment-specific overrides.

```yaml
# docker-compose.yml — base (shared between dev and prod)
services:
  api:
    build: .
    environment:
      PORT: "{{expose_port}}"
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

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
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

```yaml
# docker-compose.override.yml — dev (auto-loaded, not committed with secrets)
services:
  api:
    build:
      target: builder        # build stage has devDependencies
    volumes:
      - ./src:/app/src       # hot reload source
      - ./package.json:/app/package.json
    command: ["npm", "run", "dev"]
    environment:
      NODE_ENV: development
    ports:
      - "{{expose_port}}:{{expose_port}}"  # expose to host for local testing
```

```yaml
# docker-compose.prod.yml — production overrides
services:
  api:
    build:
      target: runner          # minimal production stage
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    environment:
      NODE_ENV: production
```

---

## Database Service with Health Check and Volume

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # runs on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s   # give postgres time to initialise before health checks begin
    networks:
      - internal

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - internal
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## Service Start Ordering (depends_on)

Docker Compose `depends_on` alone only waits for containers to start — not for services to be ready. Always combine with `condition: service_healthy`:

```yaml
services:
  api:
    depends_on:
      postgres:
        condition: service_healthy    # waits for pg_isready to pass
      redis:
        condition: service_healthy    # waits for PONG
      migrations:
        condition: service_completed_successfully  # waits for migration runner to exit 0

  migrations:
    image: flyway/flyway:10
    command: migrate
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      FLYWAY_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      FLYWAY_USER: ${POSTGRES_USER}
      FLYWAY_PASSWORD: ${POSTGRES_PASSWORD}
```

---

## Networking Between Services

Service names are resolvable as hostnames within the same Docker network. No IP addresses needed.

```yaml
services:
  api:
    environment:
      # Use service name "postgres" as hostname — not localhost, not 127.0.0.1
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    networks:
      - internal

  postgres:
    networks:
      - internal
```

**Rule**: services on the same named network can reach each other by service name. Services on different networks cannot.

---

## Hot Reload in Development

```yaml
# docker-compose.override.yml
services:
  api:
    volumes:
      - ./src:/app/src:delegated           # source code — bind mount
      - /app/node_modules                   # exclude node_modules from bind mount
    command: ["npx", "nodemon", "--watch", "src", "src/server.ts"]
    environment:
      NODE_ENV: development
      CHOKIDAR_USEPOLLING: "true"           # needed on some macOS + Docker Desktop setups
```

The `- /app/node_modules` anonymous volume prevents the host's `node_modules/` (possibly different OS) from overriding the container's installed modules.

---

## Production: Read-Only Filesystem, Resource Limits, Restart Policies

```yaml
# docker-compose.prod.yml
services:
  api:
    restart: unless-stopped
    read_only: true           # container filesystem is immutable at runtime
    tmpfs:                    # writable temp space when read_only is true
      - /tmp:size=50m
      - /app/logs:size=100m   # if the app writes logs to a directory
    security_opt:
      - no-new-privileges:true  # prevent privilege escalation
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Complete Development Example

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
      DATABASE_URL: postgres://app:${POSTGRES_PASSWORD}@postgres:5432/app
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:{{expose_port}}/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
      POSTGRES_DB: app
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD:?required}"]
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - app-network
    volumes:
      - redis-data:/data

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```
