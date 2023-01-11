"use strict";
const path = require("path");
const { defineConfig } = require("vite");
import vue from "@vitejs/plugin-vue";

module.exports = defineConfig({
    plugins: [vue({ style: { filename: "style.css" } })],
    build: {
        outDir: "./dist",
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "vue3-tree",
            fileName: (format) => `vue3-tree.${format}.js`
        },
        rollupOptions: {
            // Vue is provided by the parent project, don't compile Vue source-code inside our library.
            external: ["vue"],
            output: { globals: { vue: "Vue" } },
        },
    }
});
//# sourceMappingURL=vite.config.js.map