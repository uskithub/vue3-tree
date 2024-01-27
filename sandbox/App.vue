<script setup lang="ts">

import { findNodeById } from "../src/treenode";
import { BaseUpdatableTreenode } from "../src/treenode";
import tree from "../src/tree.vue";

import { reactive } from "@vue/reactivity";
import { watch } from "vue";

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
  , title: "root1"
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

const onArrange = (
    node : MyTreenode
    , from : {
        id : string
        , node : MyTreenode
    }
    , to : {
        id : string
        , node : MyTreenode
    }
    , index : number
) => {
    const _from = findNodeById<MyTreenode>(from.id, state.treeContent);
    const _to = findNodeById<MyTreenode>(to.id, state.treeContent);
    if (_from === null || _to === null) return;
    // 元親から削除
    _from.content.children = _from.content.children.filter((child: MyContent) => child.id !== node.id);
    // 新親に追加
    _to.content.children.splice(index, 0, node.content);
    _to.isFolding = false;
};

const onClickExport = (event: MouseEvent, node: MyTreenode) => {
    console.log("export", node);
};

const onUpdateName = (id: string, newName: string) => {
    const node = findNodeById<MyTreenode>(id, state.treeContent);
    if (node === null) return;
    node.content.title = newName;
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

</script>

<template lang="pug">
main
  button(@click="onClick") toggle contents
  //- h1 default
  //- tree(
  //-   :node="state.treeContent"
  //-   :version="state.version"
  //-   @arrange="onArrange"
  //-   @toggle-folding="(id) => state.treeContent.onToggleFolding(id)"
  //-   @update-name="onUpdateName"
  //- )
  //- textarea(:value="JSON.stringify(state.treeContent, null, 2)" readonly)
  
  h1 using slot
  tree(
    :node="state.treeContent"
    :version="state.version"
    @arrange="onArrange"
    @toggle-folding="(id) => state.treeContent.onToggleFolding(id)"
    @update-name="onUpdateName"
  )
    template(v-slot="slotProps")
      input(
        v-if="slotProps.isEditing"
        v-model="slotProps.node.name"
        v-focus
        @blur="() => { if (slotProps.endEditing) slotProps.endEditing(slotProps.node.name); }"
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