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

    rearrange(targetId : string, from: string, to: string, index: number) {
        const target = this.findNodeById(targetId)?._content;
        const exParent = this.findNodeById(from)?._content;
        const newParent = this.findNodeById(to)?._content;
        if (target === undefined || exParent === undefined || newParent === undefined) return;
        // 元親から削除
        exParent.children = exParent.children.filter((child: MyContent) => child.id !== targetId);
        // 新親に追加
        newParent.children.splice(index, 0, target);
        // newParent.isFolding = false;
        // サブツリーを再構築
        this._subtrees = this.content.children.map(c => new (this.constructor as any)(c));
    }
}