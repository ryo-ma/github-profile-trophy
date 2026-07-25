import { serve } from "@std/http/server";
import requestHandler from "./api/index.ts";

serve(requestHandler, { port: Number(Deno.env.get("PORT")) || 8080 });
