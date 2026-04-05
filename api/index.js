/**
 * Vercel Serverless Function
 * Handles / — health check
 */

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ status: "ok", server: "FF-PrivateServer", version: "1.32.0" });
};
