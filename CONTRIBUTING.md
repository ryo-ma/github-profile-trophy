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

The HTTP service uses bounded in-memory caching. Redis is not required for this
endpoint. The Docker Compose configuration is available for container-based
local development:

```sh
docker compose up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup and
[SECURITY.md](./SECURITY.md) for credential and request-handling requirements.

## Development checks

Check formatting, lint the code, and run the tests:

```sh
deno fmt --check
deno task lint
deno task test
```

Run `deno task format` to apply formatting. Follow the settings in
[.editorconfig](./.editorconfig).

Tests use mocked GitHub responses and example credentials. Keep real tokens out
of tests, fixtures, logs, and commits.

## Pull requests

Keep each pull request focused on one concern. Describe the resulting behavior
and the validation performed. Discuss substantial changes in an issue before
implementation, and preserve existing attribution and license notices.
