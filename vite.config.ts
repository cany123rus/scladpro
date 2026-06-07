import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { youwareVitePlugin } from "@youware/vite-plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [youwareVitePlugin(), react()],
  // Web workers use ES output so they can code-split (the Excel worker lazily
  // imports exceljs). IIFE/UMD worker format can't code-split.
  worker: { format: 'es' },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // No source maps in production: keeps ~12MB of maps out of the deploy and
    // avoids shipping readable source. Flip to 'hidden' if you need maps for an
    // error tracker without exposing them publicly.
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split only large, self-contained "leaf" libraries that are loaded
        // on demand. Everything else (React, Supabase, shared runtime) is left
        // to Rollup's automatic chunking, which correctly hoists shared deps
        // without dragging on-demand libs into the entry chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Only split the framework libs the entry genuinely needs at startup,
          // so they stay cached across deploys. Forcing on-demand libs (exceljs,
          // jspdf, html2canvas, bwip) into manual chunks creates a static import
          // edge that drags them into the entry — leave them to Rollup, which
          // keeps the dynamically-imported ones as deferred on-demand chunks.
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
