## Docker Infrastructure

This project is containerised with **Docker** using multi-stage builds.

### Configuration

| Setting | Value |
|---------|-------|
| Base image | `{{base_image}}` |
| Exposed port | `{{expose_port}}` |
| Registry | `{{registry}}` |
| Docker Compose | {{use_compose}} |

### Key Patterns

- **Multi-stage builds**: `builder` stage (all deps + compile), `runner` stage (production artifacts only)
- **Layer caching**: copy `package*.json` before source — deps layer is cached until lock file changes
- **Non-root user**: always run as a non-privileged user in the runner stage
- **Health check**: `HEALTHCHECK CMD wget -qO- http://localhost:{{expose_port}}/health || exit 1`
- **CMD in exec form**: `["node", "dist/index.js"]` — not shell form — for correct signal handling

### Security Rules

- Pin base image versions with SHA digest in production
- `.dockerignore` excludes `node_modules/`, `.env*`, `.git/`, `dist/` (built in container)
- No secrets in Dockerfile layers — use runtime environment variables
- `COPY` not `ADD` for file operations
- Log to stdout/stderr — never to files inside the container

### Local Development

With `use_compose: {{use_compose}}`:
- `docker-compose.yml` — base config
- `docker-compose.override.yml` — dev: bind mounts, hot reload (auto-loaded)
- `docker-compose.prod.yml` — prod: resource limits, restart policies

Service names are hostnames within Docker networks. `depends_on` with `condition: service_healthy` ensures services wait for dependencies to be ready before starting.
