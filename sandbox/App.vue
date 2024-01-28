<script setup lang="ts">

import type { TreenodeCore } from "../src/treenode";
import { findNodeById, BaseUpdatableTreenode } from "../src/treenode";
import tree from "../src/tree.vue";

import { reactive } from "@vue/reactivity";
import { watch } from "vue";
import type { TreeEventHandlers } from "../src/tree";

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
}

// custom directive for autofocus
const vFocus = {
    mounted: (el: HTMLElement) => el.focus()
};

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

const treeContent2 = {
  id: "0"
  , title: "root2"
  , children: [
    {
      id: "1"
      , title: "subtree1"
      , children: [
        {
          id: "11"
          , title: "subtree1-1"
          , children: [] as MyContent[]
        } as MyContent
        , {
          id: "12"
          , title: "subtree1-2"
          , children: [
            {
              id: "121"
              , title: "subtree1-2-1"
              , children: [] as MyContent[]
            } as MyContent
          ]
        } as MyContent
      ]
    } as MyContent
    , {
      id: "2"
      , title: "subtree2"
      , children: [] as MyContent[]
    } as MyContent
    , {
      id: "3"
      , title: "subtree3"
      , children: [] as MyContent[]
    } as MyContent
  ]
} as MyContent;

const state = reactive<{
    treeContent: MyTreenode;
    version: number;
    isContent1: boolean;
}>({
    treeContent: new MyTreenode(treeContent)
    , version: 0
    , isContent1: true
}) as {
    treeContent: MyTreenode;
    version: number;
    isContent1: boolean;
};

watch(state.treeContent, (newVal, oldVal) => {
    console.log("watch", newVal.isFolding, oldVal.isFolding);
});


const onClickExport = (event: MouseEvent, node: MyTreenode) => {
    console.log("export", node);
};

const onClick = (event: MouseEvent) => {
    if (state.isContent1) {
        console.log("===== toggle content1 -> content2 =====");
        state.treeContent = new MyTreenode(treeContent2);
    } else {
        console.log("===== toggle content2 -> content1 =====");
        state.treeContent = new MyTreenode(treeContent);
    }
    state.isContent1 = !state.isContent1;
};

const handlers: TreeEventHandlers<MyContent, MyTreenode> = {
    "arrange" : (node: MyTreenode
        , from: { id: string; node: MyTreenode; }
        , to: { id: string; node: MyTreenode; }
      , index: number) => {
        console.log("arrange", node, from, to, index);
        const _from = findNodeById<MyTreenode>(from.id, state.treeContent);
        const _to = findNodeById<MyTreenode>(to.id, state.treeContent);
        if (_from === null || _to === null) return;
        // 元親から削除
        _from.content.children = _from.content.children.filter((child: MyContent) => child.id !== node.id);
        // 新親に追加
        _to.content.children.splice(index, 0, node.content);
        _to.isFolding = false;
    }
    , "toggle-folding" : (id: string) => {
        state.treeContent.onToggleFolding(id);
    }
    , "toggle-editing" : (id: string, isEditing: boolean) => {

    }
    , "update-node" : (updatedNode: TreenodeCore<MyContent>) => {
        console.log("update", updatedNode);
        const _node = findNodeById<MyTreenode>(updatedNode.id, state.treeContent);
        if (_node === null) return;
        _node.content.title = updatedNode.name;
        state.version += 1;
    }
}
</script>

<template lang="pug">
main
  button(@click="onClick") toggle contents
  h1 default
  tree(
    :node="state.treeContent"
    :version="state.version"
    @arrange="handlers['arrange']"
    @toggle-folding="handlers['toggle-folding']"
    @update-node="handlers['update-node']"
  )
  textarea(:value="JSON.stringify(state.treeContent, null, 2)" readonly)
  
  h1 using slot
  tree(
    :node="state.treeContent"
    :version="state.version"
    @arrange="handlers['arrange']"
    @toggle-folding="handlers['toggle-folding']"
    @update-node="handlers['update-node']"
  )
    template(v-slot="slotProps")
      input(
        v-if="slotProps.isEditing"
        v-model="slotProps.node.name"
        v-focus
        @blur="() => { if (slotProps.endEditing) slotProps.endEditing(); }"
      )
      template(v-else-if="slotProps.depth===0 && !slotProps.isHovering")
        span.header {{ slotProps.depth }} : {{ slotProps.node.name }}
        i.mdi.mdi-export-variant(
          v-show="slotProps.isHovering"
          @click.prevent="onClickExport($event, slotProps.node)"
        )
      span.title(v-else) {{ slotProps.depth }} : {{ slotProps.node.name }}
</template>

<style lang="scss" scoped></style>