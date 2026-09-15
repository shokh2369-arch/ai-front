// start.ai frontend runtime config.
// apiBase "" means same origin. The Go backend on :8080 sends no CORS headers
// and does not serve this folder, so the page must be served from the same
// origin as the API — either by Go itself, or by a proxy in front of both.
window.START_AI_CONFIG = {
  apiBase: "",
  demoMode: false,
};
