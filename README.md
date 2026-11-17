# GitHub Profile Trophy

Generate SVG trophies from GitHub statistics for use in profile READMEs.

![Trophy preview](./assets/tokyonight.svg)

The preview uses example statistics. Deployed images show data from GitHub.

## Getting started

1. Follow the [deployment guide](./DEPLOYMENT.md) to deploy the service on
   Vercel.
2. Choose the statistics to publish. Leave `GITHUB_TOKEN1` and `GITHUB_TOKEN2`
   unset for public data only. To include private repository totals, set
   `GITHUB_TOKEN1` to a personal access token belonging to the account
   configured by `PERSONAL_USERNAME` in `src/security/github.ts`.
3. Add your deployment URL to your profile README:

```markdown
[![GitHub trophies](https://YOUR_PROJECT.vercel.app/?theme=tokyonight&column=-1&margin-w=10)](https://github.com/YOUR_USERNAME)
```

Replace `YOUR_PROJECT` with your deployment domain and `YOUR_USERNAME` with your
GitHub username. The `username` parameter is optional and defaults to the
configured account. If supplied, it must match that account.

A database is not required. The service uses in-memory caching and request
limits within each server instance. Optional Redis REST configuration shares
those controls across instances; see the deployment guide.

The hosted service generates trophies for one configured account. Its server
configuration controls the data included:

| GitHub credentials on the server | Statistics shown                                |
| -------------------------------- | ----------------------------------------------- |
| Neither token configured         | Public data from anonymous REST requests        |
| One or both tokens configured    | Public and accessible private repository totals |

**Images are publicly viewable in both modes. Configuring a token publishes the
private totals it can read to everyone viewing the SVG.** Repository names,
files, commit messages, review bodies, email addresses, and tokens are not
included in the image. Visitor-supplied credentials and URL parameters cannot
change the mode. See [SECURITY.md](./SECURITY.md) for the data policy and
request limits.

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

With a configured token, repository and activity lists stop at 300 records;
commit totals cover up to 100 eligible repository groups with 100 contribution
days per group. Reviews cover up to 300 reviewed pull requests and 100 submitted
author reviews per pull request. Contribution metrics use the past year. Pending
reviews and archived pull requests are excluded.

Without a token, public repository and organization lists stop at 300 records.
Language counts use each repository's primary language. Issue, pull request, and
commit counts use public REST search totals; commit search covers the past year
and GitHub's default-branch index. Review counts use up to 300 public events
from GitHub's available event history, which is limited to the last 30 days.
These bounded and anonymous sources can produce conservative totals.

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

Leave both GitHub tokens blank for public-only statistics, or set
`GITHUB_TOKEN1` in `.env` to include private repository totals. Open:

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
workflow. Its token input is optional. With a token, the generator includes
accessible private repository totals; without one, it uses public REST data. The
built-in `GITHUB_TOKEN` is scoped to the workflow repository and may not be able
to read a complete profile. Generated files must be regenerated to refresh their
statistics. Anyone given the generated file can view its totals.

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
