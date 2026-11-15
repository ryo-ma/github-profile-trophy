# Deploy this personal trophy service on Vercel

## Project settings

1. Import `BaranaNadil/github-profile-trophy2` and select the latest `master`
   commit. Keep the repository root as the Root Directory.
2. Select **Other** as the Framework Preset. Leave the Build Command, Install
   Command, and Output Directory at their default settings, without custom
   overrides. The `vercel-deno` community runtime builds the API function.
3. Add `GITHUB_TOKEN1` in Vercel's environment variables. Use a personal access
   token owned by **BaranaNadil**. Apply it to Production and any Preview
   environment you intend to use. Never put it in `vercel.json` or an image URL.
4. `GITHUB_TOKEN2` is optional. If present, it must belong to the same account.
5. Deploy the latest commit. After changing environment variables, redeploy so
   the running function receives the new settings.

The configuration uses `vercel-deno@3.2.0`, which targets Amazon Linux 2023 and
keeps Deno 1.44.4 as its default. The application's Fetch API handler is already
compatible. See the
[runtime documentation](https://github.com/vercel-community/deno).

Local `.env` files, editor settings, and test fixtures are excluded from Vercel
uploads. Deployment credentials must come from the hosting environment.

## Check the deployed endpoint

Use your assigned Vercel domain:

```text
https://YOUR_PROJECT.vercel.app/?username=BaranaNadil&theme=tokyonight&column=-1&margin-w=10
```

A correctly configured deployment returns an SVG image. Requests for another
username return HTTP 403. HTTP 503 for the owner means the configured personal
token is missing, rejected, belongs to another account, or GitHub is
unavailable. This is a runtime configuration issue, rather than a reason to
disable the owner checks. The image remains publicly viewable for use on your
GitHub profile.

If Vercel reports `should NOT have additional property public`, it is validating
an older configuration. This repository's current `vercel.json` omits that
property. Deploy the newest commit rather than retrying an old failed
deployment.

The repository includes local schema, type, and application checks; a successful
hosted deployment must still be confirmed in Vercel's deployment status and
logs. Follow [SECURITY.md](./SECURITY.md) for hosting firewall rules, cache
migration, and the limits of application-level DDoS protection.
