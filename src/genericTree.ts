import { defineComponent, h } from "vue";
import Tree from "./tree.vue";
import { Treenode } from "./treenode";

// @see: https://logaretm.com/blog/generic-type-components-with-composition-api/

type ExtractComponentProps<T> = T extends new () => { $props: infer P; } ? P : never;

export interface GenericTreeProps<U, T extends Treenode<U>> extends Omit<ExtractComponentProps<typeof Tree>, "node"> {
    node: T
};

export function genericTree<U, T extends Treenode<U>>() {
    return defineComponent((props: GenericTreeProps<U, T>) => {
        return () => h(Tree, props);
    });
};