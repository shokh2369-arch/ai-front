// Local dev server: serves this folder and forwards /api to the Go backend.
//
// The API sends no CORS headers, so the page has to be on the same origin as
// the API. In production api/proxy.js does that on Vercel; this is the same
// shape, pointed at API_BASE_URL (from the environment or .env).
//
//   node dev-server.js                 → http://localhost:5173, API at API_BASE_URL
//   node dev-server.js 3000 9090       → port 3000; API on localhost:9090 if API_BASE_URL is unset
//
// No dependencies, and nothing here ships: it exists so the static files can
// be opened over http:// instead of file://.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

// .env fills in whatever the shell has not already set.
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch (_) { /* no .env is fine */ }

const PORT = Number(process.argv[2]) || 5173;
const API_PORT = Number(process.argv[3]) || 8080;
const API = new URL((process.env.API_BASE_URL || "").replace(/\/+$/, "") || `http://127.0.0.1:${API_PORT}`);
const client = API.protocol === "https:" ? https : http;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Anything under /api is the backend's. Streamed both ways, headers intact, so
// a 4xx from the API reaches the page as itself rather than as a proxy error.
function proxy(req, res) {
  const up = client.request(
    { protocol: API.protocol, hostname: API.hostname, port: API.port, path: API.pathname.replace(/\/$/, "") + req.url, method: req.method, headers: { ...req.headers, host: API.host } },
    (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    }
  );
  up.on("error", (e) => {
    console.error(`  ✗ ${req.method} ${req.url} → ${e.code}`);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "upstream_unreachable", message: `No backend at ${API.origin} — ${e.code}` } }));
  });
  req.pipe(up);
}

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/")) return proxy(req, res);

    const rel = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(ROOT, rel === "/" ? "index.html" : rel);
    // A request must not climb out of the folder being served.
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
        return;
      }
      res.writeHead(200, {
        "content-type": TYPES[path.extname(file)] || "application/octet-stream",
        // Dev only: always hand back what is on disk, never a cached copy.
        "cache-control": "no-store",
      });
      res.end(buf);
    });
  })
  .listen(PORT, () => {
    console.log(`start.ai  →  http://localhost:${PORT}`);
    console.log(`/api/*    →  ${API.origin}${API.pathname.replace(/\/$/, "")}`);
  });
