<script setup lang="ts">

import { findNodeById } from "../src/treenode";
import type { Treenode } from "../src/treenode";
import tree from "../src/tree.vue";

import { reactive } from "@vue/reactivity";

// custom directive for autofocus
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const treeContent = {
  id: "0"
  , name: "root"
  , styleClass: null
  , subtrees: [
    {
      id: "1"
      , name: "subtree1"
      , subtrees: [
        {
          id: "11"
          , name: "subtree1-1"
          , styleClass: null
          , subtrees: []
          , isDraggable: true
          , isFolding: false
        } as Treenode
        , {
          id: "12"
          , name: "subtree1-2"
          , subtrees: [
            {
              id: "121"
              , name: "subtree1-2-1"
              , styleClass: null
              , subtrees: []
              , isDraggable: true
              , isFolding: true
            } as Treenode
          ]
          , isDraggable: true
          , isFolding: false
        } as Treenode
      ]
      , isDraggable: true
      , isFolding: true
    } as Treenode
    , {
      id: "2"
      , name: "subtree2"
      , styleClass: null
      , subtrees: []
      , isDraggable: true
      , isFolding: true
    } as Treenode
    , {
      id: "3"
      , name: "subtree3"
      , styleClass: null
      , subtrees: []
      , isDraggable: false
      , isFolding: true
    } as Treenode
  ]
  , isDraggable: true
  , isFolding: false
} as Treenode;

const state = reactive<{
  treeContent: Treenode;
}>({
  treeContent
});

const onArrange = (
  node: Treenode
  , from: {
    id: string
    , node: Treenode
  }
  , to: {
    id: string
    , node: Treenode
  }
  , index: number
) => {
  const _from = findNodeById(from.id, state.treeContent);
  const _to = findNodeById(to.id, state.treeContent);
  if (_from === null || _to === null) return;
  // 元親から削除
  _from.subtrees = _from.subtrees.filter((subtree) => subtree.id !== node.id);
  // 新親に追加
  _to.subtrees.splice(index, 0, node);
  _to.isFolding = false;
};

const onToggleFolding = (id: string) => {
  const node = findNodeById(id, state.treeContent);
  if (node === null) return;
  node.isFolding = !node.isFolding;
};

const onClickExport = (event: MouseEvent, node: Treenode) => {
  console.log("export", node);
};

const onBlur = (event: FocusEvent) => {
  console.log("bb")
};

</script>

<template lang="pug">
main
  h1 default
  tree(
    :node="state.treeContent"
    @arrange="onArrange"
    @toggle-folding="onToggleFolding"
  )
  
  h1 using slot
  tree(
    :node="state.treeContent"
    @arrange="onArrange"
    @toggle-folding="onToggleFolding"
  )
    template(v-slot="slotProps")
      input(
        v-if="slotProps.isEditing"
        v-model="slotProps.node.name"
        v-focus
        @blur="onBlur"
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