<?php
/**
 * Free Fire v1.32.0 — Private Server Emulator (PHP)
 * Version Check Endpoint Handler
 *
 * Place this file (and version.json) in your web-root.
 * Configure your web server to route all /live/* requests here,
 * or use the built-in PHP dev server:
 *
 *   php -S 0.0.0.0:8080 router.php
 *
 * Apache (.htaccess example):
 *   RewriteEngine On
 *   RewriteRule ^live(/.*)?$ index.php [L,QSA]
 *
 * Nginx (server block example):
 *   location /live/ { try_files $uri $uri/ /index.php?$query_string; }
 */

// ─── Configuration ────────────────────────────────────────────────────────────
define('FF_VERSION', '1.32.0');
define('LOG_FILE',   __DIR__ . '/ff_requests.log');

// Version-check payload
$VERSION_PAYLOAD = [
    'version'      => FF_VERSION,
    'test_user'    => false,
    'update_url'   => '',
    'force_update' => false,
    'status'       => 0,
    'patch_url'    => '',
    'maintenance'  => false,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Log an incoming request to both stdout (for CLI / Docker logs)
 * and to LOG_FILE (persistent).
 */
function logRequest(string $note = ''): void
{
    $ts     = date('c');                                   // ISO-8601
    $method = str_pad($_SERVER['REQUEST_METHOD'] ?? 'UNK', 4);
    $path   = $_SERVER['REQUEST_URI'] ?? '/';
    $ip     = $_SERVER['HTTP_X_FORWARDED_FOR']
           ?? $_SERVER['REMOTE_ADDR']
           ?? 'unknown';
    $ip     = explode(',', $ip)[0];

    $line = sprintf('[%s]  [%s]  [%s]  %s%s',
        $ts, $method, trim($ip), $path,
        $note ? "  →  {$note}" : ''
    );

    // Print to stdout (visible in CLI / container logs)
    echo $line . PHP_EOL;

    // Append to log file
    @file_put_contents(LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);

    // If there is a request body, log a snippet
    $body = file_get_contents('php://input');
    if ($body !== '' && $body !== false) {
        $snippet = '[body] ' . substr($body, 0, 512);
        echo '  └── ' . $snippet . PHP_EOL;
        @file_put_contents(LOG_FILE, '  └── ' . $snippet . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Send a JSON response and exit.
 *
 * @param int   $statusCode  HTTP status code
 * @param mixed $data        Data to JSON-encode
 */
function sendJSON(int $statusCode, $data): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('X-Powered-By: FF-PrivateServer');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// ─── Router ───────────────────────────────────────────────────────────────────

$path = strtok($_SERVER['REQUEST_URI'] ?? '/', '?');   // strip query string

// /live/* → version check
if (preg_match('#^/live(/|$)#i', $path)) {
    logRequest('version-check → ' . FF_VERSION);
    global $VERSION_PAYLOAD;
    sendJSON(200, $VERSION_PAYLOAD);
}

// / → health check
if ($path === '/' || $path === '') {
    logRequest('health-check');
    sendJSON(200, ['status' => 'ok', 'server' => 'FF-PrivateServer', 'version' => FF_VERSION]);
}

// Everything else → 404
logRequest('404 Not Found');
sendJSON(404, ['error' => 'Not Found', 'path' => $path]);
