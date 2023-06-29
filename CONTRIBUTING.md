# Contribution Guide

## Environment

* Deno >= v1.9.2
* [Vercel](https://vercel.com/)
* GitHub API v4

## Local Run

Create `.env` file to project root directory, and write your GitHub token to the `.env` file.
Please select the authority of `repo` when creating token.

```properties
GITHUB_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# if using GitHub Enterprise:
# (this env var defaults to https://api.github.com/graphql)
GITHUB_API=https://github.example.com/api/graphql
```

Run local server.

```sh
deno run --allow-net --allow-read --allow-env debug.ts
```

Open localhost from your browser.

http://localhost:8080/?username=ryo-ma

## Editor config

Read the [.editorconfig](./.editorconfig)

## Run deno lint

If you want to contribute to my project, you should check the lint with the following command.

```sh
deno lint --unstable
```
