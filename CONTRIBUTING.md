# Contribution Guide

## Environment

- Deno >= v1.36.1
- [Vercel](https://vercel.com/)
- GitHub API v4
- Docker and Docker compose (optional)

## Local Run

Create `.env` file to project root directory, and write your GitHub token to the
`.env` file. The live service requires a personal token owned by BaranaNadil.
Use the minimum permissions needed for the statistics you want to show. See
[SECURITY.md](./SECURITY.md) for ownership verification and hosting protection.

```properties
GITHUB_TOKEN1=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GITHUB_TOKEN2=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# if using GitHub Enterprise:
# (this env var defaults to https://api.github.com/graphql)
GITHUB_API=https://github.example.com/api/graphql
```

Run local server.

```sh
deno task start
```

The live personal endpoint uses bounded in-memory owner-data caching. The legacy
Redis provider and response-file cache are not used by that endpoint. The Docker
Compose configuration is retained for upstream development.

```sh
docker compose up -d
```

Rename `env-example` to `.env`, and change ENABLE_REDIS to true

Open localhost from your browser.

http://localhost:8080/?username=BaranaNadil&theme=tokyonight

## Editor config

Read the [.editorconfig](./.editorconfig)

## Pull Requests

Pull requests are always welcome! In general, they should a single concern in
the least number of changed lines as possible. For changes that address core
functionality, it is best to open an issue to discuss your proposal first. I
look forward to seeing what you come up with!

## Run deno lint

## What to do before contributing

### 1. Run deno lint

```sh
deno task lint
```

### 2. Run deno format

```sh
deno task format
```

### 3. Run deno test

```sh
deno task test
```
