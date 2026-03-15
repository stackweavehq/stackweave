# Build Docker Image

Build and tag the Docker image for this project.

## Steps

1. Determine the image name:
   - If `{{registry}}` is set: `{{registry}}/<project-name>`
   - If `{{registry}}` is empty: `<project-name>` (local only)

2. Get the current git SHA for tagging:

```bash
GIT_SHA=$(git rev-parse --short HEAD)
```

3. Build the image with multiple tags:

```bash
# With registry prefix ({{registry}} is set)
docker build \
  --tag {{registry}}/<project-name>:${GIT_SHA} \
  --tag {{registry}}/<project-name>:latest \
  .

# Without registry (local builds only)
docker build \
  --tag <project-name>:${GIT_SHA} \
  --tag <project-name>:latest \
  .
```

4. For production builds, target the `runner` stage explicitly (skips dev stages):

```bash
docker build \
  --target runner \
  --tag {{registry}}/<project-name>:${GIT_SHA} \
  --tag {{registry}}/<project-name>:latest \
  .
```

5. Show the run command to verify the image:

```bash
docker run --rm \
  -p {{expose_port}}:{{expose_port}} \
  -e NODE_ENV=development \
  <image-name>:latest
```

## Pushing to Registry

If `{{registry}}` is set, push after a successful build:

```bash
docker push {{registry}}/<project-name>:${GIT_SHA}
docker push {{registry}}/<project-name>:latest
```

## Build Cache Options

| Flag | Effect |
|------|--------|
| `--no-cache` | Ignore all cached layers — use when a dependency update isn't being picked up |
| `--build-arg KEY=value` | Pass build arguments defined with `ARG` in the Dockerfile |
| `--secret id=name,src=./file` | Pass a secret file without baking it into the image |
| `--platform linux/amd64` | Build for a specific platform (useful when building on Apple Silicon for a Linux server) |
| `--progress=plain` | Show full build output instead of condensed progress |

## CI/CD Example

```bash
# In a CI pipeline
GIT_SHA=$(git rev-parse --short HEAD)
IMAGE="{{registry}}/<project-name>"

docker build --target runner --tag "${IMAGE}:${GIT_SHA}" --tag "${IMAGE}:latest" .
docker push "${IMAGE}:${GIT_SHA}"
docker push "${IMAGE}:latest"
```

## Notes

- The application listens on port **{{expose_port}}**.
- Always verify the health check passes after building: the `/health` endpoint should return `200 OK`.
- For multi-platform builds (ARM + AMD64), use `docker buildx build --platform linux/amd64,linux/arm64`.
