import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import router from "./routes.js";
import { seedIfEmpty } from "./storage.js";

const __dirname = path.dirname(process.argv[1]);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));
app.use(express.json());

app.use("/api", router);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 5000;

seedIfEmpty().then(() => {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
});
