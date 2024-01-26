/*
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

export interface NodeCore {
    readonly id: Readonly<string>;
    name: string;
    styleClass: object | null;
    subtrees: this[];
    isDraggable: boolean;
    isFolding: boolean|undefined;
}

export interface Treenode<T> extends NodeCore {
    content: T;
    readonly isEditing?: Readonly<boolean>;
    readonly isHovering?: Readonly<boolean>;

    update: (newContent: T) => void;
};

export abstract class BaseTreenode<T> implements Treenode<T> {
    abstract id: string;
    abstract name: string;
    abstract styleClass: object | null;
    abstract content: T;
    abstract subtrees: this[];
    abstract isDraggable: boolean;
    abstract update(newContent: T): void;
    
    isFolding: boolean | undefined;

    // this のバインドの問題だと思われるが、
    onToggleFolding(id: string) {
        const node = findNodeById<this>(id, this);
        if (node === null) return;
        node.isFolding = !node.isFolding;
        console.log(`onToggleFolding: ${node.name} ${node.isFolding}`, node);
    }

    toJSON() {
        return {
            id: this.id
            , name: this.name
            , isFolding: this.isFolding
            , subtrees: this.subtrees
        };
    }
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

export function findNodeById<T extends Treenode<any>>(id: string, node: T): T | null {
    if (node.id === id) {
        return node;
    }

    for (const subtree of node.subtrees) {
        const found = findNodeById<T>(id, subtree);
        if (found) {
            return found;
        }
    }
    return null;
};