import http from "node:http";
import { createPool } from "./db.mjs";
import { createApp } from "./app.mjs";

const port = Number(process.env.PORT || 8787);
const pool = createPool(process.env.DATABASE_URL);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
const app = createApp({
  pool,
  adminToken: process.env.ADMIN_API_TOKEN,
  version: process.env.APP_VERSION || process.env.GITHUB_SHA || "dev",
  allowedOrigins,
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES || 262144)
});

const server = http.createServer(app);
server.listen(port, "0.0.0.0", () => console.log(JSON.stringify({ level: "info", event: "api_started", port })));

async function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", event: "api_stopping", signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
