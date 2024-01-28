// import type { DefineEvents } from "./treenode";

import { BaseTreenode, TreenodeCore } from "./treenode";

export type TreeProps<U, T extends BaseTreenode<U>> = {
    node: T;
    version: number;
};

export type TreeEventHandlers<U, T extends BaseTreenode<U>> = {
    "arrange" : (node: T, from: { id: string; node: T; }, to: { id: string; node: T; }, index: number) => void;
    "toggle-folding" : (id: string) => void;
    "toggle-editing" : (id: string, isEditing: boolean) => void;
    "update-node" : (updatedNode: TreenodeCore<U>) => void;
};

// export type TreeEvents<T> = DefineEvents<TreeEventHandlers<T>>
export type TreeEvents<U, T extends BaseTreenode<U>> = {
    "arrange" : [node: T, from: { id: string; node: T; }, to: { id: string; node: T; }, index: number];
    "toggle-folding" : [id: string];
    "toggle-editing" : [id: string, isEditing: boolean];
    "update-node" : [node: TreenodeCore<U>];
};
