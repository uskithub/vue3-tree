import type { BaseTreenode } from "./treenode";

export type EventHandlersFromEvents<E extends Record<PropertyKey, readonly unknown[]>> = {
    [K in keyof E]: (...args: E[K]) => void
};

export type TreeProps<U, T extends BaseTreenode<U>> = {
    node: T;
    version: number;
};

export type TreeEvents<U, T extends BaseTreenode<U>> = {
    "rearrange" : [targetId: T["id"], from: T["id"], to: T["id"], index: number];
    "toggle-folding" : [id: T["id"]];
    "toggle-editing" : [id: T["id"], isEditing: boolean];
    "update-name" : [id: T["id"], newValue: T["name"]];
};

// treeコンポーネントを利用する側で使う
export type TreeEventHandlers<U, T extends BaseTreenode<U>> = EventHandlersFromEvents<TreeEvents<U, T>>;