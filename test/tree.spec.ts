import { mount } from "@vue/test-utils"
import { describe, expect, test } from "vitest"
import { BaseUpdatableTreenode, tree } from "src"

type MyContent = {
    id : string;
    title : string;
    type : string;
    children : MyContent[];
};

class MyTreenode extends BaseUpdatableTreenode<MyContent> {
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
    get styleClass(): object | null { return { [this._content.type]: true }; }
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

const treeContent = {
    id: "0"
    , title: "Vue3-treeの動作を確認する"
    , children: [
      {
        id: "1"
        , title: "初期表示が正しいこと"
        , children: [
          {
            id: "11"
            , title: "ツリーすべてが表示されること"
            , children: [] as MyContent[]
          } as MyContent
          , {
            id: "12"
            , title: "階層構造に間違いがないこと"
            , children: [] as MyContent[]
          } as MyContent
          , {
            id: "13"
            , title: "キャレットの開閉が正しいこと"
            , children: [] as MyContent[]
          } as MyContent
        ]
      } as MyContent
      , {
        id: "2"
        , title: "アクションによる表示の変化が正しくされること"
        , children: [
            {
              id: "21"
              , title: "キャレットが正しく切り替わること"
              , children: [
                {
                  id: "211"
                  , title: "開いているときにクリックで閉じること"
                  , children: [] as MyContent[]
                } as MyContent
                , {
                  id: "212"
                  , title: "閉じているときにクリックで開くこと"
                  , children: [] as MyContent[]
                } as MyContent
              ]
            } as MyContent
            , {
                id: "22"
                , title: "ドラッグが正しく動作すること"
                , children: [
                  {
                    id: "221"
                    , title: "ドラッグすると元と同様の要素が半透明で表示されること"
                    , children: [] as MyContent[]
                  } as MyContent
                  , {
                    id: "222"
                    , title: "ドロップターゲット（ピンク）が正しく表示されること"
                    , children: [
                        {
                          id: "2221"
                          , title: "ドラッグが他要素の子領域に入ったとき、ドロップターゲットが表示されること"
                          , children: [] as MyContent[]
                        }
                        , {
                          id: "2222"
                          , title: "ドロップターゲット表示中、ドラッグが別の要素の子領域に入ると、ドロップターゲットが更新されること"
                          , children: [] as MyContent[]
                        }
                        , {
                          id: "2223"
                          , title: "ドロップターゲット表示中、ドラッグが元の領域に入ると、ドロップターゲットが消えること"
                          , children: [] as MyContent[]
                        }
                      ]
                  } as MyContent
                ]
              } as MyContent
        ]
      } as MyContent
      , {
        id: "3"
        , title: "表示通りにノードの更新が行われていること"
        , children: [
            {
              id: "31"
              , title: "ifFolfing（折りたたまれている）が更新されること"
              , children: [] as MyContent[]
            } as MyContent
            , {
              id: "32"
              , title: "node.nameが更新されること"
              , children: [] as MyContent[]
            } as MyContent
            , {
              id: "33"
              , title: "tree内のノードの移動が更新されること"
              , children: [] as MyContent[]
            } as MyContent
        ] 
      } as MyContent
    ]
} as MyContent;

describe('Component', () => {
    test('is a Vue instance', () => {
        const wrapper = mount(tree, {
            props: {
                node: new MyTreenode(treeContent),
                version: 0
            }
        })
        expect(wrapper.element).toMatchSnapshot()
    })
})