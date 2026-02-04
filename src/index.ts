import VTree from "./tree.vue";
import VTreenode from "./treenode.vue";

// Global component types
import "./global.d.ts";

// Types
export type { TreeEvents, TreeEventHandlers, TreeProps } from "./tree";
export type { TreenodeCore, TreenodeEventHandlers, TreenodeEvents } from "./treenode";
export { findNodeById, BaseTreenode, BaseUpdatableTreenode, BaseEditableTreenode } from "./treenode";

// Components - export for direct import usage
export { VTree, VTreenode };

// Legacy export for backward compatibility
export { VTree as tree };

// Plugin exports
export { createVue3Tree, Vue3TreePlugin, type Vue3TreePluginOptions } from "./plugin";

// Default export is the plugin
export { Vue3TreePlugin as default } from "./plugin";