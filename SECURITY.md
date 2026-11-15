# Security

The HTTP service serves the account configured by `PERSONAL_USERNAME` in
`src/security/github.ts`. Images are public; request parameters cannot select
another account. Credentials are supplied by the hosting environment.

## Public data policy

Repository queries request `privacy: PUBLIC`. Repository, issue, pull request,
commit, and review records must also carry both `visibility: PUBLIC` and
`isPrivate: false`. Private, internal, inconsistent, and unknown visibility
records are excluded before totals are calculated. Unfiltered GitHub aggregate
counts and restricted contribution totals are not used.

Account age and follower counts come from the unauthenticated public profile
endpoint, so a privileged token cannot expand the profile data being displayed.
Organization counts use GitHub's documented public-membership endpoint. Reviews
must be submitted, belong to the configured account, and fall within the past
year. Pending reviews and archived pull requests are excluded.

Only numeric trophy statistics reach the public SVG or shared statistics cache.
Private repository names, file contents, email addresses, review bodies, and
GitHub tokens are not part of that projection. Owner verification requests only
the authenticated viewer's login through GraphQL.

Requests are bounded: repository, issue, authored pull request, public
organization, and reviewed pull request listings stop after 300 records each.
Commit queries inspect at most 100 repository groups and the first 100
contribution days per group. Review queries inspect the latest 100 author
reviews per checked pull request. Contributions use the past-year window. Counts
can therefore be conservative for large accounts; the service never fills gaps
with private totals.

## Credentials and caching

`GITHUB_TOKEN1` must belong to the configured account. `GITHUB_TOKEN2` is
optional and must belong to the same account. Use the minimum read permissions
required for public statistics, set an expiration, and rotate exposed tokens.
The live endpoint does not accept tokens from visitors or query strings.

Hosted requests require an HTTPS Redis REST service configured with
`RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN`. The Redis credential is
separate from the GitHub token; recognizable GitHub tokens and reused configured
GitHub credentials are rejected as Redis credentials.

Redis stores a validated owner proof for five minutes and a strict projection of
14 numeric statistics for 15 minutes. Keys bind the account, GitHub API
endpoint, policy version, and a SHA-256 credential fingerprint. Raw GitHub
tokens are not stored in keys or values. Local in-flight requests coalesce;
shared locks prevent multiple instances from refreshing the same source
simultaneously. Expired lock owners cannot publish or remove another worker's
lock.

Shared expiry is authoritative. A cache hit does not gain a new local lifetime.
Token removal denies subsequent requests; token rotation changes the cache
scope. Revocation at GitHub is detected during the next owner verification or
upstream request. Public visibility changes are reflected on the next statistics
refresh. A cached image is a snapshot of data that was public when fetched.

All HTTP responses use `private, no-store`, `nosniff`, and a restrictive content
security policy. Redis outages, malformed cached values, and failed ownership
checks fail closed. Cached errors are never used as successful source data.

Keep `.env` and `.env.*` out of Git, container images, and uploads. Never place
credentials in image URLs, source files, logs, or browser code. Production
imports use local application modules; dotenv is loaded only by local/CLI entry
points. The committed `deno.lock` pins remote dependency content for those entry
points, and CI verifies it without allowing unnoticed dependency changes.

## Request limits

Valid requests receive a local per-client allowance of 60 requests per minute.
Client identity comes from the socket peer or Vercel's overwritten forwarding
metadata, not arbitrary forwarding headers on a standalone server. Unknown
clients share a bounded bucket. Invalid requests are rejected before spending
the valid-image allowance or the shared counter.

One atomic Redis operation enforces 60 requests per minute per client and 300
across the deployment. Client denials do not consume the global allowance, and
global denials do not create client entries. Client identifiers are hashed and
expire with the current global window. Raw IP addresses are not stored in Redis
keys. Hashes are short-lived identifiers, not a claim of irreversible anonymity.

The hosted API requires the shared limiter even when provider system variables
are unavailable. Local development can use memory limits; other public hosting
must set `REQUIRE_SHARED_RATE_LIMIT=true`. Missing or unavailable shared
services return HTTP 503 rather than silently reverting to a weaker public
configuration.

Only GET and HEAD on the documented API routes are accepted. URLs, parameter
counts, layout dimensions, and filters are bounded. GitHub connections and
bodies have two-second abort deadlines and a two-MiB response cap; statistics
fetching has a six-second overall deadline. Redis commands have one-second
deadlines, bounded response sizes, bounded lock waits, and expiring locks.
Source failures trigger a local 30-second cooldown. GitHub rate limits remain
HTTP 429.

## Hosting and containers

Vercel serves static files only from `public/`; application source remains part
of the function bundle and is not published as static content. Configure hosting
firewall rules before function execution and set usage/spending controls. Redis
limits bound application work but do not replace network DDoS mitigation or
prevent every billable request. Browser challenges can also block image proxies.

Use equivalent edge controls and prevent origin bypass on other hosts. A reverse
proxy must enforce its own client limits because the standalone server treats
the proxy as its socket peer. Purge cached responses when changing access rules.

The container uses a pinned image, a non-root user, scoped Deno permissions, and
runtime-supplied environment variables. Compose binds to loopback, uses a
read-only root filesystem, and does not publish an unused Redis service. Docker
network permissions allow GitHub.com by default; add explicit Redis or
Enterprise hosts when enabling those services. Container images must not contain
`.env`.

## Automation and verification

Composite action inputs are passed through quoted environment-backed arguments.
Action revisions are pinned, checkout credentials are not persisted, and
workflow tokens have explicit permissions. Real credentials are never required
in unit tests. Run `deno task test`, `deno task lint`, and formatting checks
before changes.

Local tests verify public-only filtering, cache and lock behavior, request
fairness, timeouts, credential boundaries, and safe failure. They do not prove
that hosting firewall rules, real Redis credentials, or PAT permissions have
been configured correctly. Confirm those settings in the hosting account.

References:
[GitHub GraphQL users](https://docs.github.com/en/graphql/reference/users),
[public organization memberships](https://docs.github.com/en/rest/orgs/orgs#list-organizations-for-a-user),
[GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use),
[Vercel request headers](https://vercel.com/docs/headers/request-headers),
[Vercel firewall](https://vercel.com/docs/vercel-firewall).
