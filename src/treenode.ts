export interface Treenode {
    id: string;
    name: string;
    styleClass: object | null;
    // content: object;
    subtrees: Treenode[];
    isDraggable: boolean;
    isFolding: boolean;
};

export function findNodeById(id: string, node: Treenode): Treenode | null {
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