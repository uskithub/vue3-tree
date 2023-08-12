<script setup lang="ts">

import { findNodeById } from "../src/treenode";
import type { Treenode } from "../src/treenode";
import tree from "../src/tree.vue";
import type { TreeProps } from "../src/tree.vue";

import { reactive } from "@vue/reactivity";


type MyContent = {
    id : string;
    title : string;
    type : string;
    children : MyContent[];
};

class MyTreenode implements Treenode<MyContent> {
    private _content: MyContent;
    isFolding: boolean;

    constructor(content: MyContent) {
        this._content = content;
        this.isFolding = false;
    }

    get id(): string { return this._content.id; }
    get name(): string { return this._content.title; }
    get styleClass(): object | null { return { [this._content.type]: true }; }
    get content(): MyContent { return this._content; }
    get subtrees(): this[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this._content.children.map(c => new (this.constructor as any)(c));
    }
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
  , title: "root"
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
}>({
    treeContent: new MyTreenode(treeContent)
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
    const _from = findNodeById(from.id, state.treeContent);
    const _to = findNodeById(to.id, state.treeContent);
    if (_from === null || _to === null) return;
    // 元親から削除
    _from.content.children = _from.content.children.filter((child: MyContent) => child.id !== node.id);
    // 新親に追加
    _to.content.children.splice(index, 0, node.content);
    _to.isFolding = false;
};

const onToggleFolding = (id: string) => {
    const node = findNodeById(id, state.treeContent);
    if (node === null) return;
    node.isFolding = !node.isFolding;
};

const onClickExport = (event: MouseEvent, node: MyTreenode) => {
    console.log("export", node);
};

const onUpdateName = (id: string, newName: string) => {
    const node = findNodeById(id, state.treeContent);
    if (node === null) return;
    node.content.title = newName;
};

</script>

<template lang="pug">
main
  h1 default
  tree(
    :node="state.treeContent"
    @arrange="onArrange"
    @toggle-folding="onToggleFolding"
    @update-name="onUpdateName"
  )
  
  h1 using slot
  my-tree(
    :node="state.treeContent"
    @arrange="onArrange"
    @toggle-folding="onToggleFolding"
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