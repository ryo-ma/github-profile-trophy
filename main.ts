import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { createLocalRequestHandler } from "./api/index.ts";

const handler = createLocalRequestHandler();

Deno.serve(
  { hostname: "0.0.0.0", port: Number(Deno.env.get("PORT")) || 8080 },
  (request, info) => handler(request, info.remoteAddr.hostname),
);
