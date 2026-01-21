# Contribution Guide

## Local Development

### Prerequisites

- Deno >= v1.36.1
- GitHub API v4
- Docker and Docker compose (optional)

### Setup

Create `.env` file to project root directory, and write your GitHub token to the
`.env` file. Please select the authority of `repo` when creating token.

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

You can enable the Redis if you want, but it's not mandatory.

```sh
docker compose up -d
```

Rename `env-example` to `.env`, and change ENABLE_REDIS to true

Open localhost from your browser.

http://localhost:8080/?username=ryo-ma

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

## Production Deployment

### Vercel

The project is configured for deployment on Vercel by default. The `vercel.json` configuration handles the routing automatically.

For more information, see the [Vercel documentation](https://vercel.com/docs).

### Linux Server (Ubuntu)

#### Prerequisites

- Linux server with SSH access (Ubuntu in this example)
- Docker installed
- Reverse proxy server installed (nginx in this example)
- certbot installed for SSL certificate (https)

#### Deployment Steps

1. **SSH into your server and clone the repository**:
   ```sh
   ssh your-server
   git clone https://github.com/ryo-ma/github-profile-trophy.git
   cd github-profile-trophy
   ```

2. **Set up environment file** (see [Local Development](#local-development) for token setup):
   ```sh
   cp env-example .env
   ```
   
   Edit `.env` and configure:
   ```properties
   ENABLE_REDIS=true
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_PASSWORD=dummy-pwd-to-avoid-ERR-AUTH
   ```

3. **Build and start services**:
   ```sh
   docker compose -f docker-compose.prod.yml up --build -d
   ```

#### Server configuration

1. **Add DNS record pointing on your server**

   ```
   A your-server-ip your-domain.com
   ```

2. **Add Reverse Proxy Configuration (nginx)**

   In `/etc/nginx/sites-enabled/default`, add the following configuration:

   ```nginx
   server {
       server_name your-domain.com;
 
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Add SSL certificate**

     ```
     certbot --nginx
     ```

4. **Reload nginx configuration**

   ```
   systemctl reload nginx
   ```