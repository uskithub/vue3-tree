import VTree from "./tree.vue";
import VTreenode from "./treenode.vue";

// Global component types
import "./global.d.ts";

// Types
export type { TreeEventHandlers } from "./tree";
export { findNodeById, BaseUpdatableTreenode as BaseTreenode } from "./treenode";

// Components - export for direct import usage
export { VTree, VTreenode };

// Legacy export for backward compatibility
export { VTree as tree };

// Plugin exports
export { createVue3Tree, Vue3TreePlugin, type Vue3TreePluginOptions } from "./plugin";

// Default export is the plugin
export { Vue3TreePlugin as default } from "./plugin";