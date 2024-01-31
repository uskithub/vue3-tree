/**
 * TreenodeEventHandlers から TreenodeEvents を自動生するためDefineEventsを作ったが、コンパイルが通らない。 * @see: https://github.com/vuejs/core/issues/8286
 * 
 * [vite:vue] [@vue/compiler-sfc] Failed to resolve index type into finite keys
 * 
 * /Users/yusuke/Workspaces/vue3-tree/src/treenode.ts
 * 1  |  export type DefineEvents<T> = {
 * 2  |      [U in keyof T] : T[U] extends  (...args: infer A) => void
 *    |            ^^^^^^^
 * 3  |          ? A
 * 4  |          : never;
 */ 
// export type DefineEvents<T> = {
//     [U in keyof T] : T[U] extends (...args: infer A) => void
//         ? A
//         : never;
// };

// Tree/Treeview で使う
export interface TreenodeCore<T> {
    readonly id: Readonly<string>;
    readonly content: Readonly<T>;
    name: string;
    styleClass: object | null;
    subtrees: this[];
    isDraggable: boolean;
    isFolding: boolean|undefined;
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

// App.vue で使う
export abstract class BaseUpdatableTreenode<T> extends BaseTreenode<T> implements NodeUpdatable<T> {
    abstract update(newContent: T): void;
}

// Tree/Treeview で使う
export abstract class BaseEditableTreenode<T> extends BaseTreenode<T> implements NodeEditable {
    abstract isEditing?: boolean;
    abstract isHovering?: boolean;
}

export type TreenodeEventHandlers<T> = {
    "dragenter" : (event: DragEvent, node: T) => void;
    "dragstart" : (event: DragEvent, parent: T, node: T) => void;
    "dragend" : (event: DragEvent, node: T) => void;
    "dragenter-temporarily-open" : (event: DragEvent, node: T) => void;
    "mouse-leave" : (event: MouseEvent, node: T) => void;
    "toggle-folding" : (event: MouseEvent, id: string) => void;
    "toggle-editing" : (event: MouseEvent, id: string, isEditing: boolean) => void;
    "hover" : (event: MouseEvent, id: string, isHovering: boolean) => void;
};

// export type TreenodeEvents<T> = DefineEvents<TreenodeEventHandlers<T>>
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