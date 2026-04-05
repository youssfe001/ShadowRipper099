<?php
/**
 * PHP built-in dev-server router.
 *
 * Usage:
 *   php -S 0.0.0.0:8080 router.php
 *
 * This file routes every request to index.php so the path-based
 * logic inside index.php works correctly with the built-in server.
 */

// Serve real static files (e.g. version.json requested directly)
if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . $_SERVER['REQUEST_URI'])) {
    // Let the built-in server handle actual static files
    return false;
}

require __DIR__ . '/index.php';
