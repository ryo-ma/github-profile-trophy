import { serve } from "./../deps.ts";
import { GithubAPIClient } from './../src/github_api_client.ts';
const client = new GithubAPIClient();
await client.requestUserData("ryo-ma");
const server = serve({ port: 8080 });
for await (const req of server) {
    req.respond({ body: "<h1> TEST </h1>"});
}