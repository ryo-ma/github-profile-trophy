# Scripts

## generate-trophy-svg.ts

Generate an SVG using the local request handler.

```
deno run -A scripts/generate-trophy-svg.ts \
  --username luojiyin1987 \
  --output generated/luojiyin1987.svg
```

You can also build the URL from a username and extra query parameters:

```
deno run -A scripts/generate-trophy-svg.ts \
  --username luojiyin1987 \
  --query "column=-1&theme=onedark" \
  --output generated/luojiyin1987.svg
```

Environment variables:
- `GITHUB_TOKEN1` (required)
- `GITHUB_TOKEN2` (optional)
- `GITHUB_API` (optional)

## Smoke test

```
deno run scripts/generate-trophy-svg.smoke.ts
```
