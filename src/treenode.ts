import type { EventHandlersFromEvents } from "./tree";

// 内部（Tree/Treeview）で使う
export interface TreenodeCore<T> {
    readonly id: Readonly<string>;
    readonly content: Readonly<T>;
    name: string;
    styleClass: object | null;
    subtrees: this[];
    isDraggable: boolean;
    isFolding: boolean | undefined;
}

interface NodeEditable {
    isEditing?: boolean;
    isHovering?: boolean;
}

interface NodeUpdatable<T> {
    update: (newContent: T) => void;
}

export abstract class BaseTreenode<T> implements TreenodeCore<T> {
    abstract id: string;
    abstract content: T;
    abstract name: string;
    abstract styleClass: object | null;
    abstract subtrees: this[];
    abstract isDraggable: boolean;
    
    isFolding: boolean | undefined;

    findNodeById(id: string): this | null {
        return findNodeById<T, this>(id, this);
    }

    onToggleFolding(id: string) {
        const node = findNodeById<T, this>(id, this);
        if (node === null) return;
        node.isFolding = !node.isFolding;
        console.log(`onToggleFolding: ${node.name} ${node.isFolding}`, node);
    }

    toJSON(this: BaseTreenode<T>) {
        return {
            id: this.id
            , name: this.name
            , isFolding: this.isFolding
            , subtrees: this.subtrees
        };
    }
}

// treeコンポーネントを利用する側で使う
export abstract class BaseUpdatableTreenode<T> extends BaseTreenode<T> implements NodeUpdatable<T> {
    abstract update(newContent: T): void;
}

// 内部（Tree/Treeview）で使う
export abstract class BaseEditableTreenode<T> extends BaseTreenode<T> implements NodeEditable {
    abstract isEditing?: boolean;
    abstract isHovering?: boolean;
}

export type TreenodeEvents<T> = {
    "dragenter" : [event: DragEvent, node: T];
    "dragstart" : [event: DragEvent, parent: T, node: T];
    "dragend" : [event: DragEvent, node: T];
    "dragenter-temporarily-open" : [event: DragEvent, node: T];
    "mouse-leave" : [event: MouseEvent, node: T];
    "toggle-folding" : [event: MouseEvent, id: string];
    "toggle-editing" : [event: MouseEvent, id: string, isEditing: boolean];
    "hover" : [event: MouseEvent, id: string, isHovering: boolean];
};

export type TreenodeEventHandlers<T> = EventHandlersFromEvents<TreenodeEvents<T>>;

export type Mutable<Type> = {
    -readonly [Property in keyof Type]: Type[Property];
};

export function findNodeById< U, T extends TreenodeCore<U>>(id: string, node: T): T | null {
    if (node.id === id) {
        return node;
    }

    for (const subtree of node.subtrees) {
        const found = findNodeById<U, T>(id, subtree);
        if (found) {
            return found;
        }
    }
    return null;
};