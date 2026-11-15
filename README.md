# GitHub Profile Trophy

Generate SVG trophies from GitHub statistics for use in profile READMEs.

![Trophy preview](./assets/tokyonight.svg)

The preview uses example statistics. Deployed images show data from GitHub.

## Getting started

1. Follow the [deployment guide](./DEPLOYMENT.md) to deploy the service on
   Vercel.
2. Set `GITHUB_TOKEN1` to a personal access token belonging to the account
   configured by `PERSONAL_USERNAME` in `src/security/github.ts`.
3. Set the Redis REST environment variables described in the deployment guide.
4. Add your deployment URL to your profile README:

```markdown
[![GitHub trophies](https://YOUR_PROJECT.vercel.app/?theme=tokyonight&column=-1&margin-w=10)](https://github.com/YOUR_USERNAME)
```

Replace `YOUR_PROJECT` with your deployment domain and `YOUR_USERNAME` with your
GitHub username. The `username` parameter is optional and defaults to the
configured account. If supplied, it must match that account.

Statistics are calculated only from explicitly public resources. Private
repositories, hidden activity, pending reviews, and archived pull requests are
excluded. The hosted service generates trophies for one configured account.
Images are publicly viewable, and deployment tokens stay on the server. See
[SECURITY.md](./SECURITY.md) for token requirements and request limits.

## Trophies and ranks

Trophies summarize stars, commits, followers, issues, pull requests,
repositories, reviews, and account experience. Additional trophies appear when
their conditions are met.

| Rank             | Description                                   |
| ---------------- | --------------------------------------------- |
| `SSS`, `SS`, `S` | Highest achievement tiers                     |
| `AAA`, `AA`, `A` | Advanced achievement tiers                    |
| `B`, `C`         | Initial achievement tiers                     |
| `?`              | No qualifying activity yet                    |
| `SECRET`         | A trophy with a special acquisition condition |

Each panel displays its category, rank, achievement description, score, and
progress toward the next rank.

Large-account counts are bounded: lists stop at 300 records; commit totals cover
up to 100 public repository groups with 100 contribution days per group. Reviews
cover up to 300 reviewed pull requests and 100 submitted author reviews per pull
request. Contribution metrics use the past year. Counts can be conservative;
private aggregate totals are never used to fill gaps.

## Request parameters

| Parameter  | Default               | Accepted values                                  |
| ---------- | --------------------- | ------------------------------------------------ |
| `username` | Configured account    | The configured GitHub username, case-insensitive |
| `theme`    | `tokyonight`          | A theme listed below                             |
| `column`   | `8`                   | `1`-`15`, or `-1` for a single adaptive row      |
| `row`      | `3`                   | `1`-`15`                                         |
| `margin-w` | `0`                   | Horizontal spacing from `0` to `30`              |
| `margin-h` | `0`                   | Vertical spacing from `0` to `30`                |
| `title`    | All eligible trophies | Comma-separated category names                   |
| `rank`     | All ranks             | Comma-separated rank values                      |
| `no-bg`    | `false`               | `true` for a transparent background              |
| `no-frame` | `false`               | `true` to hide panel frames                      |

Unknown parameters, duplicate scalar parameters, and invalid values are
rejected. Title and rank filters accept up to 30 values each.

### Filter categories

Use category names such as `Stars`, `Commits`, `Followers`, `Issues`,
`PullRequest`, `Repositories`, `Reviews`, or `Experience`:

```text
https://YOUR_PROJECT.vercel.app/?title=Stars,Followers
```

Prefix a category with `-` to exclude it:

```text
https://YOUR_PROJECT.vercel.app/?title=-Stars,-Followers
```

### Filter ranks

Include specific ranks:

```text
https://YOUR_PROJECT.vercel.app/?rank=S,AAA
```

Or exclude ranks:

```text
https://YOUR_PROJECT.vercel.app/?rank=-C,-B
```

Use `?` for the unknown rank, or `-?` to exclude it.

### Layout

```text
https://YOUR_PROJECT.vercel.app/?column=3&margin-w=10&margin-h=10
```

Set `column=-1` to fit all eligible trophies into one row. The row limit clips
panels that exceed the requested layout.

### Background and frames

```text
https://YOUR_PROJECT.vercel.app/?no-bg=true&no-frame=true
```

## Themes

Select a theme with the `theme` parameter:

```text
https://YOUR_PROJECT.vercel.app/?theme=onedark
```

Available themes:

`alduin`, `algolia`, `apprentice`, `aura`, `buddhism`, `chalk`, `dark_dimmed`,
`dark_lover`, `darkhub`, `default`, `discord`, `dracula`, `flat`, `gitdimmed`,
`gruvbox`, `juicyfresh`, `kimbie_dark`, `matrix`, `monokai`, `nord`, `oldie`,
`onedark`, `onestar`, `radical`, `tokyonight`.

Theme colors and rendering options are defined in
[src/theme.ts](./src/theme.ts).

## Local development

Use Deno 1.44.4 to match the CI and deployment runtime.

```sh
cp env-example .env
deno task start
```

Set `GITHUB_TOKEN1` in `.env` before starting the server. Open:

```text
http://localhost:8080/?theme=tokyonight
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development checks and contribution
instructions.

## Generate an SVG file

The command-line generator reads credentials from the environment or `.env`:

```sh
deno run --allow-net --allow-env --allow-read --allow-write render_svg.ts USERNAME ./assets/trophy.svg tokyonight
```

Use [action.yml](./action.yml) to run the generator in a trusted GitHub Actions
workflow. Generated files must be regenerated to refresh their statistics.

To render the example preview without GitHub credentials:

```sh
deno run --allow-write scripts/preview_theme.ts
```

## Documentation

- [Deployment](./DEPLOYMENT.md)
- [Security](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

## Credits and license

Based on
[GitHub Profile Trophy](https://github.com/ryo-ma/github-profile-trophy) by
ryo-ma and its contributors. Licensed under the [MIT License](./LICENSE).
