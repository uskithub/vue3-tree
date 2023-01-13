<script setup lang="ts">

import type { Treenode } from "../src/treenode";
import tree from "../src/tree.vue";

import { reactive } from "@vue/reactivity";


const treeContent = {
  id: "0"
  , name: "root"
  , subtrees: [
    {
      id: "1"
      , name: "subtree1"
      , subtrees: [
        {
          id: "11"
          , name: "subtree1-1"
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
      , subtrees: []
      , isDraggable: true
      , isFolding: true
    } as Treenode
    , {
      id: "3"
      , name: "subtree3"
      , subtrees: []
      , isDraggable: false
      , isFolding: true
    } as Treenode
  ]
  , isDraggable: true
  , isFolding: true
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
  // 元親から削除
  from.node.subtrees = from.node.subtrees.filter((subtree) => subtree.id !== node.id);
  // 新親に追加
  to.node.subtrees.splice(index, 0, node);
  to.node.isFolding = true;
};

const onToggleFolding = (node: Treenode) => {
  node.isFolding = !node.isFolding;
};

const onClickExport = (event: MouseEvent, node: Treenode) => {
  console.log("export", node);
};

</script>

<template lang="pug">
main
  tree(
    :node="state.treeContent"
    @arrange="onArrange"
    @toggle-folding="onToggleFolding"
  )
    template(v-slot="slotProps")
      template(v-if="slotProps.depth === 0")
        span.header {{ slotProps.depth }} : {{ slotProps.node.name }}
        i.mdi.mdi-export-variant(
          v-show="slotProps.node.isHovering"
          @click.prevent="onClickExport($event, slotProps.node)"
        )
      span.title(v-else) {{ slotProps.depth }} : {{ slotProps.node.name }}
</template>

<style lang="scss" scoped></style>