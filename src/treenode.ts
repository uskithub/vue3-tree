export interface Treenode<T> {
    readonly id: Readonly<string>;
    name: string;
    styleClass: object | null;
    content: T;
    subtrees: this[];
    isDraggable: boolean;
    isFolding: boolean|undefined;
    readonly isEditing?: Readonly<boolean>;
    readonly isHovering?: Readonly<boolean>;
};

export type Mutable<Type> = {
    -readonly [Property in keyof Type]: Type[Property];
  };

export function findNodeById<U, T extends Treenode<U>>(id: string, node: T): T | null {
    if (node.id === id) {
        return node;
    }

    for (const subtree of node.subtrees) {
        const found = findNodeById(id, subtree);
        if (found) {
            return found;
        }
    }
    return null;
};