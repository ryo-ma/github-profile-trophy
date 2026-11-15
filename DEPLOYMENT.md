# Deployment

## Vercel settings

1. Import the repository and select the intended branch. Use the repository root
   and the **Other** framework preset. Leave build/install overrides unset.
2. Confirm the account configured by `PERSONAL_USERNAME` in
   `src/security/github.ts`.
3. Add `GITHUB_TOKEN1` as an encrypted environment variable. It must be a
   personal access token for that account. `GITHUB_TOKEN2` is optional for the
   same account.
4. Apply the variables to Production and any intended Preview environment.
   Follow the GitHub Actions setup below to deploy. Run the deployment again
   after changing environment variables.

A database is not required. The default deployment uses in-memory caching and
request limits within each server instance.

## GitHub Actions deployment

The **Project checks and deployment** workflow runs on pushes to `master` and
can also be started manually. Its production job runs only after dependency,
formatting, lint, type, and test checks succeed. Pull requests run checks
without deploying or receiving Vercel credentials. Active production runs finish
in order.

Under **Settings > Secrets and variables > Actions**, add these repository
settings:

| Name                | Storage  | Value                                                        |
| ------------------- | -------- | ------------------------------------------------------------ |
| `VERCEL_TOKEN`      | Secret   | A Vercel deployment token for the existing project/workspace |
| `VERCEL_ORG_ID`     | Variable | The existing Vercel workspace/team ID                        |
| `VERCEL_PROJECT_ID` | Variable | The existing Vercel project ID                               |

The workflow also accepts the IDs as secrets for existing setups. The token must
be a secret. Repository settings work with the workflow's `Production`
environment; environment-level settings are optional. Never store a deployment
token as a plain repository variable.

Create a suitably scoped deployment token in
[Vercel account settings](https://vercel.com/account/settings/tokens). It is
separate from the GitHub PAT. Find the project ID in the Vercel project's
General settings and the team ID in the workspace's General settings. If the
project is linked locally, `.vercel/project.json` contains `projectId` and
`orgId`. Keep that generated directory out of Git.

After saving these settings, open **Actions > Project checks and deployment >
Run workflow**, select `master`, and start it. Subsequent pushes to `master`
deploy automatically. The job summary and GitHub's `Production` environment link
to the resulting deployment.

The workflow uses a pinned Vercel CLI, pulls the existing project's Production
settings, builds once, and uploads the prebuilt output. It checks metadata for
`GITHUB_TOKEN1` in Vercel's Production environment before deployment, without
decrypting Sensitive values. If either optional Redis setting is present, both
must be configured. Application credentials stay in Vercel settings; they are
not GitHub deployment secrets. Downloaded environment files are neither cached
nor published as artifacts and are removed at job end.

`vercel.json` disables Vercel's separate Git-triggered deployments so production
uses the Actions checks as its deployment gate. The repository can remain
connected in Vercel. Missing deployment configuration or application settings
stop the workflow with an error instead of publishing an unconfigured service.
See
[Vercel's GitHub Actions guide](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

## Hosting behavior

Each server instance caches its validated owner proof for five minutes and its
public numeric statistics for 15 minutes. Concurrent requests within an instance
share one source load. The default request allowance is 60 requests per minute
per client and 300 total per minute within each instance. Cold starts and
additional instances have independent caches and allowances.

[vercel.json](./vercel.json) builds the community Deno function and sets
`public/` as the static output directory. Do not override it with the repository
root. Only public assets belong there. Source files and local environment files
are not static assets. The function's maximum duration is 30 seconds to
accommodate bounded source/cache operations; the statistics fetch itself is
capped at six seconds. See the
[runtime documentation](https://github.com/vercel-community/deno).

The API returns HTTP 503 when required GitHub credentials, owner verification,
or upstream statistics are unavailable. Provider system variables should remain
enabled so trusted client IP metadata is recognized.

### Optional shared caching and limits

To share caching and request allowances across instances, configure
`RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN` for an HTTPS Redis REST
service supporting `GET`, `SET`, and `EVAL`. Use its HTTPS REST URL and a
dedicated Redis REST credential. Leave both settings unset to use the default
in-memory mode.

Once either setting is supplied, the service requires a valid pair. Incomplete
configuration, malformed cached data, or an unavailable configured backend
returns HTTP 503. Set `REQUIRE_SHARED_RATE_LIMIT=true` only when shared storage
is explicitly required; this also returns 503 if the Redis settings are absent.

No shared service is provisioned by the repository. Choose the provider's plan
and usage limits before enabling this optional backend. Keep its credentials
restricted to the service and out of browser code and image URLs.

## Verify a deployment

```text
https://YOUR_PROJECT.vercel.app/?theme=tokyonight&column=-1&margin-w=10
```

The `username` parameter is optional and must match the configured account if
provided. The result contains public-only, bounded statistics; private activity
is excluded and some large-account totals may be conservative.

Check normal requests, rather than running a load test against a live
deployment:

| Request                                            | Expected result                                           |
| -------------------------------------------------- | --------------------------------------------------------- |
| Owner image URL                                    | `200`, SVG content and `Cache-Control: private, no-store` |
| Another username                                   | `403`                                                     |
| Duplicate or invalid parameters                    | `400`                                                     |
| Unsupported method                                 | `405`                                                     |
| Exceeded request budget                            | `429` with `Retry-After`                                  |
| Missing GitHub credentials or unavailable upstream | `503`                                                     |
| Configured Redis incomplete or unavailable         | `503`                                                     |
| `/src/security/github.ts`, `/.env`, `/.git/config` | `404`                                                     |

When Redis is configured, cold concurrent requests may briefly receive `503` if
a source refresh does not finish within the bounded shared-lock wait. Retry
after the returned delay.

Validate the selected commit and inspect Vercel's build/runtime logs if a check
fails. Clear old deployment or image-proxy caches when changing privacy policy.
Local tests do not replace a successful hosted build and runtime verification.

## Firewall and usage controls

Configure edge rate-limit rules before requests reach the function. Use the
provider's firewall, usage alerts, and spending controls. A starting point is 60
requests per minute per source IP, adjusted for legitimate image proxies. The
application limits and caching reduce work but do not eliminate volumetric DDoS
traffic or all function invocation charges. In-memory limits apply separately to
each instance, so they are not a deployment-wide quota. See
[SECURITY.md](./SECURITY.md).

## Container deployment

Copy `env-example` to `.env`, supply runtime credentials, and run
`docker compose up --build`. Compose exposes only `127.0.0.1:8080`; use a
protected reverse proxy for public access. The container also uses in-memory
limits and caching by default. Configure the optional Redis REST settings for
shared controls across replicas, and set `REQUIRE_SHARED_RATE_LIMIT=true` if
that backend must be required.

The container restricts network access to its listener and GitHub.com by
default. To use Redis REST or GitHub Enterprise, explicitly add the
corresponding HTTPS host to the container command's Deno `--allow-net` list.
Keep the other permission restrictions. Environment files are supplied at
runtime and excluded from images.
