import type { IncomingMessage, ServerResponse } from "http";
import { app, ensureReady } from "../server/app.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureReady();
  } catch (err) {
    console.error("[api] database not ready:", err);
    res.statusCode = 503;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Database not ready, please retry" }));
    return;
  }
  return (app as any)(req, res);
}
