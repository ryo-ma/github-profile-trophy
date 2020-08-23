import { serve } from "https://deno.land/std@0.66.0/http/server.ts";
import { Card } from "./src/card.ts";
const s = serve({ port: 8080 });
for await (const req of s) {
  req.respond(
    {
      body: new Card().render(),
      headers: new Headers({ "Content-Type": "image/svg+xml" }),
    },
  );
}
