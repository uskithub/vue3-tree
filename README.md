vue3-tree
==========


# How to use

```vue
<script setup lang="ts">
import "vue3-tree/style.css";

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
</script>
<template>
  <main>
    <tree :node="state.treeContent"></tree>
  </main>
</template>
```

## Slot

```typescript
type slotProps = {
    node: Treenode;
    parent: Trenode | undefind;
    depth: Number;
}
```

## Events

```typescript
{
  (e: "dragenter", event: MouseEvent, node: Treenode): void,
  (e: "arrange", node: Treenode, from: { id: string, node: Treenode }, to: { id: string, node: Treenode }, index: number): void
  (e: "toggle-folding", node: Treenode): void
  (e: "hover", node: Treenode, isHovering: boolean): void
}
```
