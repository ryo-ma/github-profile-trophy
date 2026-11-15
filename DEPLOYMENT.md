# Deployment

## Vercel project settings

1. Import the repository into Vercel and select the deployment branch. Use the
   repository root as the Root Directory.
2. Select **Other** as the Framework Preset. Leave the Build Command, Install
   Command, and Output Directory at their defaults without custom overrides.
3. Confirm that `PERSONAL_USERNAME` in `src/security/github.ts` identifies the
   GitHub account the deployment should serve.
4. Add `GITHUB_TOKEN1` as an encrypted environment variable. Use a personal
   access token belonging to the configured account. Select Production and any
   Preview environment that should receive the token.
5. Add `GITHUB_TOKEN2` only if a second token is needed. It must belong to the
   same account.
6. Deploy the selected branch. Redeploy after changing environment variables so
   the function receives the new settings.

The runtime is configured in [vercel.json](./vercel.json). The `vercel-deno`
community runtime builds the API function using Deno 1.44.4. See the
[runtime documentation](https://github.com/vercel-community/deno) for details.

Local `.env` files, editor settings, and test fixtures are excluded from
uploads. Keep deployment credentials in the hosting environment.

## Verify the endpoint

Replace `YOUR_PROJECT` with the assigned Vercel domain:

```text
https://YOUR_PROJECT.vercel.app/?theme=tokyonight&column=-1&margin-w=10
```

The endpoint returns an SVG for the configured account. To supply the account
explicitly, add `username=YOUR_USERNAME`, replacing the placeholder with the
configured username. A different username returns HTTP 403.

| Status | Meaning                                                                                      |
| ------ | -------------------------------------------------------------------------------------------- |
| `200`  | The SVG was generated successfully                                                           |
| `400`  | A query parameter is invalid or duplicated                                                   |
| `403`  | The requested username does not match the configured account                                 |
| `429`  | The application or GitHub request limit was reached                                          |
| `503`  | Credentials are missing or rejected, ownership verification failed, or GitHub is unavailable |

If a deployment fails, review its build or runtime logs in Vercel. Check
`vercel.json` against the linked schema and confirm that the deployment uses the
intended commit. Local checks validate the application; the hosting provider's
status confirms whether a deployment succeeded.

## Hosting protection

Configure firewall rules and usage controls in the hosting account. Application
limits operate per instance and do not replace edge DDoS mitigation. See
[SECURITY.md](./SECURITY.md) for configuration guidance.
