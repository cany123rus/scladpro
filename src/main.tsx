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
    (m.includes("module script") && m.includes("failed"))
  );
};

const handleChunkLoadError = (message: string) => {
  if (!isChunkError(message)) return;

  const url = new URL(window.location.href);
  if (url.searchParams.get("chunk-reload") === "1") {
    // second failure after forced reload: stop loop, let ErrorBoundary render
    return;
  }

  // force full navigation with cache-buster param
  url.searchParams.set("chunk-reload", "1");
  url.searchParams.set("t", String(Date.now()));
  window.location.replace(url.toString());
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

// cleanup helper query params after successful bootstrap
try {
  const u = new URL(window.location.href);
  if (u.searchParams.has("chunk-reload") || u.searchParams.has("t")) {
    u.searchParams.delete("chunk-reload");
    u.searchParams.delete("t");
    window.history.replaceState({}, "", u.toString());
  }
} catch {}

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
