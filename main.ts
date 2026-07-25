import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import requestHandler from "./api/index.ts";

serve(requestHandler, { port: Number(Deno.env.get("PORT")) || 8080 });
