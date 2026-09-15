// ═══ start.ai — browser storage ═══
// localStorage access, guarded. Nothing here is a secret.

// ── Browser storage ────────────────────────────────────────────────────
// localStorage throws outright in some privacy modes. Every read returns a
// value or null; every write is best-effort. Nothing here is a secret.
function lsGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
}
function lsDel(key) {
  try { localStorage.removeItem(key); } catch (_) {}
}
