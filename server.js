/**
 * Free Fire v1.32.0 — Private Server Emulator
 * Version Check Endpoint Handler
 *
 * Listens on PORT (default 8080) and handles all requests
 * under /live/ — returning the version payload that tells
 * the Unity client it is up-to-date, bypassing the update screen.
 */

const http = require("http");
const url  = require("url");

// ─── Configuration ────────────────────────────────────────────────────────────
const PORT    = process.env.PORT || 8080;
const VERSION = "1.32.0";

// Version-check response payload.
// status: 0  → OK / up-to-date
// force_update / maintenance: false → skip update / maintenance screens
const VERSION_PAYLOAD = {
  version:      VERSION,
  test_user:    false,
  update_url:   "",
  force_update: false,
  status:       0,
  patch_url:    "",
  maintenance:  false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a log line with timestamp, method, path, and optional extra info. */
function logRequest(req, note = "") {
  const now    = new Date().toISOString();
  const method = req.method.padEnd(4);
  const path   = req.url;
  const ip     = (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  ).split(",")[0].trim();

  const parts = [`[${now}]`, `[${method}]`, `[${ip}]`, path];
  if (note) parts.push(`→ ${note}`);

  console.log(parts.join("  "));
}

/** Write a JSON response. */
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type":  "application/json",
    "Content-Length": Buffer.byteLength(body),
    "X-Powered-By":  "FF-PrivateServer",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  res.end(body);
}

// ─── Request Router ───────────────────────────────────────────────────────────

/**
 * Route table.
 *
 * The Unity client sends the version-check request to one of several paths
 * under /live/.  We handle all of them the same way and fall back to a
 * generic 404 for anything completely unrelated.
 *
 * Known FF version-check paths (add more as discovered via packet capture):
 *   /live/
 *   /live/version.json
 *   /live/config.xml        ← some builds use XML path but expect JSON body
 *   /live/checkversion
 *   /live/versioncheck
 */
const LIVE_PATH_RE = /^\/live(\/|$)/i;

function router(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;

  // ── /live/* → version check ─────────────────────────────────────────────
  if (LIVE_PATH_RE.test(pathname)) {
    logRequest(req, `version-check → ${VERSION}`);

    // Collect request body for debugging (POST / PUT)
    if (req.method === "POST" || req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end",  () => {
        if (body) console.log("  └── Request body:", body.slice(0, 512));
        sendJSON(res, 200, VERSION_PAYLOAD);
      });
    } else {
      sendJSON(res, 200, VERSION_PAYLOAD);
    }
    return;
  }

  // ── / (root) → health-check / sanity ────────────────────────────────────
  if (pathname === "/" || pathname === "") {
    logRequest(req, "health-check");
    sendJSON(res, 200, { status: "ok", server: "FF-PrivateServer", version: VERSION });
    return;
  }

  // ── Everything else → 404 ────────────────────────────────────────────────
  logRequest(req, "404 Not Found");
  sendJSON(res, 404, { error: "Not Found", path: pathname });
}

// ─── Server Boot ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  try {
    router(req, res);
  } catch (err) {
    console.error("[ERROR]", err);
    sendJSON(res, 500, { error: "Internal Server Error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     Free Fire v1.32.0 — Private Server Emulator         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Listening on  →  http://0.0.0.0:${PORT}                   ║`);
  console.log(`║  Version check →  http://0.0.0.0:${PORT}/live/             ║`);
  console.log("║  Press Ctrl+C to stop                                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[FATAL] Port ${PORT} is already in use.`);
    console.error(`        Try:  PORT=8081 node server.js`);
  } else {
    console.error("[FATAL]", err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT",  () => { console.log("\n[INFO] Shutting down…"); server.close(() => process.exit(0)); });
process.on("SIGTERM", () => { console.log("\n[INFO] Shutting down…"); server.close(() => process.exit(0)); });
