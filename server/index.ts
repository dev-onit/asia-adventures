import path from "path";
import express from "express";
import { app, ready } from "./app.js";

// Works in both ESM (import.meta.url) and CJS (__dirname via esbuild injection)
const __dirname = path.dirname(process.argv[1]);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 5000;

ready.then(() => {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
});
