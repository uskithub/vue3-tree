import type { App, Component, Plugin } from "vue";
import VTree from "./tree.vue";
import VTreenode from "./treenode.vue";

// Cast generic components to Component for plugin registration
// This is necessary because Vue's app.component() doesn't accept generic component types directly
// Generic Vue 3 components require double assertion through 'unknown'
const VTreeComponent: Component = VTree;
const VTreenodeComponent: Component = VTreenode;

/**
 * Plugin options for Vue3 Tree
 */
export interface Vue3TreePluginOptions {
  /**
   * Custom component names
   * @default { tree: 'Vue3Tree', treenode: 'Vue3Treenode' }
   */
  components?: {
    tree?: string;
    treenode?: string;
  };
}

/**
 * Creates the Vue3 Tree plugin for Vuetify 3
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createVuetify } from 'vuetify'
 * import { createVue3Tree } from 'vue3-dnd-tree'
 * import 'vue3-dnd-tree/style.css'
 *
 * const app = createApp(App)
 * const vuetify = createVuetify()
 * const vue3Tree = createVue3Tree()
 *
 * app.use(vuetify)
 * app.use(vue3Tree)
 * app.mount('#app')
 * ```
 */
export function createVue3Tree(options: Vue3TreePluginOptions = {}): Plugin<[]> {
  const { components = {} } = options;
  const treeName = components.tree ?? "Vue3Tree";
  const treenodeName = components.treenode ?? "Vue3Treenode";

  return {
    install(app: App) {
      app.component(treeName, VTreeComponent);
      app.component(treenodeName, VTreenodeComponent);
    },
  };
}

/**
 * Default plugin instance
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import Vue3Tree from 'vue3-dnd-tree'
 * import 'vue3-dnd-tree/style.css'
 *
 * const app = createApp(App)
 * app.use(Vue3Tree)
 * app.mount('#app')
 * ```
 */
export const Vue3TreePlugin: Plugin<[]> = {
  install(app: App) {
    app.component("Vue3Tree", VTreeComponent);
    app.component("Vue3Treenode", VTreenodeComponent);
  },
};
