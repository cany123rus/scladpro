import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

const isChunkError = (message: string) => {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("importing a module script failed") || // iOS Safari
    m.includes("'text/html' is not a valid javascript mime type") ||
    m.includes("unable to preload css") ||
    (m.includes("module script") && m.includes("failed")) ||
    // SPA-rewrite served index.html for a missing hashed chunk → module is HTML,
    // so `.default` is undefined. Match that specific shape only.
    (m.includes("default") && (m.includes("undefined is not an object") || m.includes("cannot read properties of undefined")))
  );
};

// Loop guard via sessionStorage: reload at most once per 30s window. Using a URL
// param failed because the bootstrap cleanup stripped it before the lazy chunk
// re-failed, producing an endless reload (screen flicker).
const RELOAD_KEY = "__chunk_reload_at";
const handleChunkLoadError = (message: string) => {
  if (!isChunkError(message)) return;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    if (Date.now() - last < 30000) return; // already reloaded recently → stop loop
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable: bail out rather than risk a loop
    return;
  }
  // Drop caches + SW so the fresh index/chunks are fetched, then hard reload.
  const finish = () => window.location.reload();
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(finish).catch(finish);
    } else { finish(); }
  } catch { finish(); }
};

window.addEventListener("error", (event) => {
  const message = String((event as ErrorEvent)?.message || "");
  handleChunkLoadError(message);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason: any = (event as PromiseRejectionEvent)?.reason;
  const message = String(reason?.message || reason || "");
  handleChunkLoadError(message);
});

// Vite fires this when a dynamic import / preload fails (stale chunk after deploy).
window.addEventListener("vite:preloadError", (event: any) => {
  try { event.preventDefault(); } catch {}
  handleChunkLoadError("failed to fetch dynamically imported module");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register the app-shell service worker for offline support (PWA).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
