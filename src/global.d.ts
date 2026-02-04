import type VTree from "./tree.vue";
import type VTreenode from "./treenode.vue";

declare module "vue" {
  export interface GlobalComponents {
    VTree: typeof VTree;
    VTreenode: typeof VTreenode;
  }
}

export {};
