<script setup lang="ts">

import Treenode from "./treenode";
import tree from "../src/tree.vue";

import { reactive } from "@vue/reactivity";


const treeContent = {
  id: "1"
  , name: "root"
  , subtrees: [
    {
      id: "11"
      , name: "treeコンポーネントの実装"
      , subtrees: [
        {
          id: "111"
          , name: "SassでのFontAwesome利用"
          , subtrees: []
          , isDraggable: true
          , isFolding: false
        } as Treenode
        , {
          id: "112"
          , name: "コンポーネントの外部化"
          , subtrees: []
          , isDraggable: true
          , isFolding: false
        } as Treenode
        , {
          id: "113"
          , name: "subtree1-3"
          , subtrees: [
            {
              id: "1131"
              , name: "subtree1-3-1"
              , subtrees: []
              , isDraggable: true
              , isFolding: true
            } as Treenode
            , {
              id: "1132"
              , name: "subtree1-3-2"
              , subtrees: []
              , isDraggable: true
              , isFolding: true
            } as Treenode
            , {
              id: "1133"
              , name: "subtree1-3-3"
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
      id: "12"
      , name: "subtree2"
      , subtrees: []
      , isDraggable: true
      , isFolding: true
    } as Treenode
    , {
      id: "13"
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

</script>

<template>
  <main>
    <h1>Welcome to your your sandbox environment</h1>
    <tree :node="state.treeContent" @arrange="onArrange" @toggle-folding="onToggleFolding">
      <template v-slot="slotProps">
          <span>{{ slotProps.node.name }}</span>
      </template>
    </tree>
  </main>
</template>

<style lang="scss" scoped></style>