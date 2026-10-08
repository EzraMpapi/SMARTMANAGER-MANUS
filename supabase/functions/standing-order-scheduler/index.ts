import { handleSchedulerRequest } from "./lib.ts";

Deno.serve((request) => handleSchedulerRequest(request));
