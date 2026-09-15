// The only dynamic route on the site. Secrets stay in server env; the handler
// and everything it reads are in src/server/ask.
import index from "../../../generated/ask-index.json" with { type: "json" };
import { createAskHandler } from "../../../server/ask/handler.ts";

export const runtime = "nodejs";
export const maxDuration = 10;

let handler: ReturnType<typeof createAskHandler> | undefined;

export async function POST(req: Request): Promise<Response> {
  handler ??= createAskHandler({ env: process.env, index });
  return handler(req);
}
