import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes.js";
import { seedIfEmpty } from "./storage.js";

export const app = express();
// Vercel's edge network sits in front of every request — trust its X-Forwarded-For
// so express-rate-limit keys on the real client IP instead of erroring.
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Global rate limit
app.use(rateLimit({ windowMs: 60_000, max: 200 }));
// Tighter limit on write endpoints
const writeLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Too many requests" } });
app.use("/api/favourites", writeLimiter);
app.use(express.json());

app.use("/api", router);

// Memoized per warm instance, but a failure (e.g. a transient cold-start blip from
// the database) clears the cache so the next request retries instead of staying broken.
let seedPromise: Promise<void> | null = null;

export function ensureReady() {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}
