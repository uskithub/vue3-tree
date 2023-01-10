export interface Treenode {
    id: string;
    name: string;
    // styleClass: object|null;
    // content: object;
    subtrees: Treenode[];
    isDraggable: boolean;
    isFolding: boolean;
};