/// <reference types="vitest" />

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: "./dist",
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "Vue3Tree",
            fileName: (format) => `vue3-tree.${format}.js`,
        },
        rollupOptions: {
            // External dependencies - these should be provided by the consuming application
            external: ["vue", "vuetify"],
            output: {
                globals: {
                    vue: "Vue",
                    vuetify: "Vuetify",
                },
                // Use named exports for better tree-shaking
                exports: "named",
                // Ensure CSS is extracted to a separate file
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === "style.css") return "style.css";
                    return assetInfo.name ?? "assets/[name][extname]";
                },
            },
        },
        // Generate sourcemaps for easier debugging
        sourcemap: true,
        // Minify for production
        minify: "esbuild",
    },
    test: {
        environment: "happy-dom",
    },
});