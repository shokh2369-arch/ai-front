// Vercel function: forwards /api/* to the Go backend at API_BASE_URL.
//
// The API sends no CORS headers, so the browser has to stay on this origin;
// this function is the hop to the backend. vercel.json rewrites every
// /api/<path> here as /api/proxy?__path=<path>, with the original query kept.
//
// API_BASE_URL is set in Vercel → Project → Settings → Environment Variables,
// e.g. https://my-backend.example.com (no trailing /api).

// Hop-by-hop and length headers describe one connection, not the message;
// fetch sets its own on the way out and decodes the body on the way back.
const DROP_REQ = new Set(["host", "connection", "content-length", "transfer-encoding", "accept-encoding", "x-forwarded-host"]);
const DROP_RES = new Set(["connection", "content-length", "transfer-encoding", "content-encoding", "keep-alive"]);

function fail(res, status, code, message) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: { code, message } }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  const base = (process.env.API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return fail(res, 500, "API_BASE_URL_MISSING", "API_BASE_URL is not set on this deployment");

  const url = new URL(req.url, "http://local");
  const sub = (url.searchParams.get("__path") || "").replace(/^\/+/, "");
  url.searchParams.delete("__path");
  const query = url.searchParams.toString();
  const target = `${base}/api/${sub}${query ? "?" + query : ""}`;

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!DROP_REQ.has(k) && v !== undefined) headers[k] = Array.isArray(v) ? v.join(", ") : v;
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let up;
  try {
    up = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
      redirect: "manual",
    });
  } catch (e) {
    return fail(res, 502, "upstream_unreachable", `Backend unreachable: ${e.message}`);
  }

  // Status and body pass through untouched, so a 4xx from the API reaches the
  // page as itself rather than as a proxy error.
  res.statusCode = up.status;
  up.headers.forEach((v, k) => {
    if (!DROP_RES.has(k)) res.setHeader(k, v);
  });
  res.end(Buffer.from(await up.arrayBuffer()));
};
