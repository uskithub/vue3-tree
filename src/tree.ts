import type { BaseTreenode } from "./treenode";

export type TreeProps<U, T extends BaseTreenode<U>> = {
    node: T;
    version: number;
};

export type TreeEventHandlers<U, T extends BaseTreenode<U>> = {
    "rearrange" : (targetId: T["id"], from: T["id"], to: T["id"], index: number) => void;
    "toggle-folding" : (id: T["id"]) => void;
    "toggle-editing" : (id: T["id"], isEditing: boolean) => void;
    "update-name" : (id: T["id"], newValue: T["name"]) => void;
};

/* export type TreeEvents<T> = DefineEvents<TreeEventHandlers<T>> */
export type TreeEvents<U, T extends BaseTreenode<U>> = {
    "rearrange" : [targetId: T["id"], from: T["id"], to: T["id"], index: number];
    "toggle-folding" : [id: T["id"]];
    "toggle-editing" : [id: T["id"], isEditing: boolean];
    "update-name" : [id: T["id"], newValue: T["name"]];
};
