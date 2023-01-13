export interface Treenode {
    id: string;
    name: string;
    styleClass: object | null;
    // content: object;
    subtrees: this[];
    isDraggable: boolean;
    isFolding: boolean|undefined;
};

export interface _Treenode extends Treenode {
    isEditing: boolean|undefined;
    isHovering: boolean|undefined;
};

export function findNodeById<T extends Treenode>(id: string, node: T): T | null {
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