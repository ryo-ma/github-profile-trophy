# Contributing

## Requirements

- Deno 1.44.4, matching CI and the deployment runtime
- A GitHub personal access token for the configured account
- Docker and Docker Compose, if using the container environment

## Local setup

Copy the environment example and configure credentials:

```sh
cp env-example .env
```

Set `GITHUB_TOKEN1` to a token belonging to the account identified by
`PERSONAL_USERNAME` in `src/security/github.ts`. `GITHUB_TOKEN2` is optional and
must belong to the same account. Use only the permissions required for the
statistics the service displays.

For GitHub Enterprise, set `GITHUB_API` to the HTTPS GraphQL endpoint:

```properties
GITHUB_API=https://github.example.com/api/graphql
```

Start the server:

```sh
deno task start
```

Open the local endpoint:

```text
http://localhost:8080/?theme=tokyonight
```

Local and hosted servers use bounded in-memory limits and caching within each
instance by default. No database is required. Configure both Redis REST settings
to test shared limits and caching; set `REQUIRE_SHARED_RATE_LIMIT=true` when
explicitly testing a required shared backend. The Docker Compose configuration
is available for container-based local development:

```sh
docker compose up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup and
[SECURITY.md](./SECURITY.md) for credential and request-handling requirements.

## Development checks

Check formatting, lint the code, and run the tests:

```sh
deno cache --lock=deno.lock deps.ts api/index.ts main.ts render_svg.ts
deno fmt --check
deno task lint
deno task test
```

Run `deno task format` to apply formatting. Follow the settings in
[.editorconfig](./.editorconfig).

Dependency updates must deliberately regenerate `deno.lock` and review changed
URLs and checksums. CI rejects unexpected lockfile changes.

Tests use mocked GitHub and Redis responses and example credentials. Keep real
tokens out of tests, fixtures, logs, and commits.

## Pull requests

Keep each pull request focused on one concern. Describe the resulting behavior
and the validation performed. Discuss substantial changes in an issue before
implementation, and preserve existing attribution and license notices.
