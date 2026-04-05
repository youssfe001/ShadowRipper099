/**
 * Vercel Serverless Function
 * Handles all /live/* requests — Free Fire v1.32.0 version check
 */

const VERSION_PAYLOAD = {
  version:      "1.32.0",
  test_user:    false,
  update_url:   "",
  force_update: false,
  status:       0,
  patch_url:    "",
  maintenance:  false,
};

module.exports = (req, res) => {
  const ip     = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const ts     = new Date().toISOString();
  console.log(`[${ts}]  [${req.method}]  [${ip}]  ${req.url}  →  version-check → 1.32.0`);

  res.setHeader("Content-Type",  "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("X-Powered-By",  "FF-PrivateServer");
  res.status(200).json(VERSION_PAYLOAD);
};
