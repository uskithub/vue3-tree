import VTree from "./tree.vue";
import VTreenode from "./treenode.vue";

// Types
export type { TreeEventHandlers } from "./tree";
export { findNodeById, BaseUpdatableTreenode as BaseTreenode } from "./treenode";

// Components - export for direct import usage
export { VTree, VTreenode };

// Plugin exports
export { createVue3Tree, Vue3TreePlugin, type Vue3TreePluginOptions } from "./plugin";

// Default export is the plugin
export { Vue3TreePlugin as default } from "./plugin";

// Types for the components the plugin registers globally, under the plugin's default
// names. Declared here rather than in a standalone .d.ts on purpose: vue-tsc does not
// re-emit declaration files, so a .d.ts of our own never reaches dist/types and the
// augmentation would be silently missing for consumers.
declare module "vue" {
    export interface GlobalComponents {
        Vue3Tree: typeof VTree;
        Vue3Treenode: typeof VTreenode;
    }
}
