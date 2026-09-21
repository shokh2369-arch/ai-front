// Local dev server: serves this folder and forwards /api to the Go backend.
//
// The API sends no CORS headers, so the page has to be on the same origin as
// the API. In production Vercel does that with a rewrite (vercel.json); this
// is the same shape, pointed at a backend on localhost.
//
//   node dev-server.js                 → http://localhost:5173, API on :8080
//   node dev-server.js 3000 9090       → port 3000, API on :9090
//
// No dependencies, and nothing here ships: it exists so the static files can
// be opened over http:// instead of file://.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.argv[2]) || 5173;
const API_PORT = Number(process.argv[3]) || 8080;
const API_HOST = process.env.API_HOST || "127.0.0.1";
const ROOT = __dirname;

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
  const up = http.request(
    { host: API_HOST, port: API_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` } },
    (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    }
  );
  up.on("error", (e) => {
    console.error(`  ✗ ${req.method} ${req.url} → ${e.code}`);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "upstream_unreachable", message: `No backend on ${API_HOST}:${API_PORT} — ${e.code}` } }));
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
    console.log(`/api/*    →  http://${API_HOST}:${API_PORT}`);
  });
