import { BaseUpdatableTreenode as BaseTreenode } from "../src/treenode";

export type MyContent = {
    id : string;
    title : string;
    type : string;
    children : MyContent[];
};

export class MyTreenode extends BaseTreenode<MyContent> {
    private _content: MyContent;
    private _subtrees: this[];
    
    constructor(content: MyContent) {
        super();
        this._content = content;
        this._subtrees = content.children.map(c => new (this.constructor as any)(c));
        this.isFolding = false;
    }

    get id(): string { return this._content.id; }
    get name(): string { return this._content.title; }
    get styleClass(): object | null { return this._content.type ? { [this._content.type]: true } : null; }
    get content(): MyContent { return this._content; }
    get subtrees(): this[] { return this._subtrees; }
    get isDraggable(): boolean { return true; }
  
    update(newContent: MyContent) {
        this._content = newContent;
    }

    findNodeById(id: string, node: MyContent = this._content): MyContent | null {
        if (node.id === id) { return node; }

        for (const child of node.children) {
            const found = this.findNodeById(id, child);
            if (found) { return found; }
        }
        return null;
    }

    rearrange(targetId : string, from: string, to: string, index: number) {
        const node = this.findNodeById(targetId);
        const exParent = this.findNodeById(from);
        const newParent = this.findNodeById(to);
        if (node === null || exParent === null || newParent === null) return;
        // 元親から削除
        exParent.children = exParent.children.filter((child: MyContent) => child.id !== targetId);
        // 新親に追加
        newParent.children.splice(index, 0, node);
        // newParent.isFolding = false;
        // サブツリーを再構築
        this._subtrees = this.content.children.map(c => new (this.constructor as any)(c));
    }
}