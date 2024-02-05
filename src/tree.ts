import type { BaseTreenode, TreenodeCore } from "./treenode";

export type TreeProps<U, T extends BaseTreenode<U>> = {
    node: T;
    version: number;
};

export type TreeEventHandlers<U, T extends BaseTreenode<U>> = {
    "rearrange" : (targetId: string, from: string, to: string, index: number) => void;
    "toggle-folding" : (id: string) => void;
    "toggle-editing" : (id: string, isEditing: boolean) => void;
    "update-name" : (id: string, newValue: string) => void;
};

// export type TreeEvents<T> = DefineEvents<TreeEventHandlers<T>>
export type TreeEvents<U, T extends BaseTreenode<U>> = {
    "rearrange" : [targetId: string, from: string, to: string, index: number];
    "toggle-folding" : [id: string];
    "toggle-editing" : [id: string, isEditing: boolean];
    "update-name" : [id: string, newValue: string];
};
