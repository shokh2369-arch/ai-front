// start.ai frontend runtime config.
//
// apiBase "" means "same origin as this page". The Go API sends no CORS
// headers, so the page must be served from the same origin as the API —
// either by the backend itself, or behind a proxy that fronts both.
// Setting an absolute cross-origin URL here will be blocked by the browser.
//
// Live API: https://ai-backend-x6tp.onrender.com
//
// demoMode is a deliberate build-time choice, never a fallback: a failed live
// request stays failed and is never answered with fixture data.
window.START_AI_CONFIG = {
  apiBase: "",
  demoMode: false,
};
