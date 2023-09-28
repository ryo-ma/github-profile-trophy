import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import requestHandler from "./api/index.ts";

serve(requestHandler, { port: 8080 });
