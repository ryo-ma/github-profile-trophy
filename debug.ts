import { serve } from "https://deno.land/std@0.66.0/http/server.ts";
import requestHandler from "./index.ts";

const s = serve({ port: 8080 });
for await (const req of s) {
  requestHandler(req);
}
