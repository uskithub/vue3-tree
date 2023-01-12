<script setup lang="ts">
import type { Treenode } from "./treenode";
import { useSlots } from "vue";

const props = defineProps<{
  parent: Treenode | undefined
  , node: Treenode
  , depth: Number
}>();

const slots = useSlots();

// @note: stateを一箇所に集めないと処理上の様々なな判断が困難なため、stateの保持および処理はRootコンポーネント（tree）で行い、
//        子ノード（treenode）ではイベントを発火させるだけとする。記述を簡潔にするためにコンポーネントを分けて実装する。

const emit = defineEmits<{
  (e: "dragenter", event: MouseEvent, node: Treenode): void,
  (e: "dragstart", event: MouseEvent, parent: Treenode, node: Treenode): void,
  (e: "dragend", event: MouseEvent, node: Treenode): void,
  (e: "toggle-caret", event: MouseEvent, id: string): void
  (e: "hover", event: MouseEvent, id: string, isHovering: boolean): void
}>();

const onDragenter = (e: MouseEvent, treenode: Treenode) => {
  emit("dragenter", e, treenode);
  e.stopPropagation();
};

const onDragstart = (e: MouseEvent, parent: Treenode, treenode: Treenode) => {
  emit("dragstart", e, parent, treenode);
  e.stopPropagation();
};

const onDragend = (e: MouseEvent, treenode: Treenode) => {
  emit("dragend", e, treenode);
  e.stopPropagation();
};

const onToggleCaret = (e: MouseEvent, id: string) => {
  emit("toggle-caret", e, id);
  e.stopPropagation();
};

const onHover = (e: MouseEvent, id: string, isHovering: boolean) => {
  emit("hover", e, id, isHovering);
  e.stopPropagation();
};
</script>

<template lang="pug">
ul.subtree(
  :data-id="props.node.id"
  @dragenter="onDragenter($event, props.node)"
)
  li(
    v-for="childnode in props.node.subtrees",
    :key="childnode.id", 
    :data-id="childnode.id", 
    :draggable="childnode.isDraggable"
    :class="{ freeze : !childnode.isDraggable, ...childnode.styleClass }"
    @dragstart="onDragstart($event, props.node, childnode)"
    @dragend="onDragend($event, childnode)"
  )
    .tree-item(
      @mouseover.prevent="onHover($event, childnode.id, true)"
      @mouseout.prevent="onHover($event, childnode.id, false)"
    )
      i.mdi(
        v-if="childnode.subtrees.length > 0"
        :class="childnode.isFolding ? 'mdi-menu-down' : 'mdi-menu-right'"
        @click.prevent="emit('toggle-caret', $event, childnode.id)"
      )
      i.mdi.mdi-circle-small(v-else)
      slot(:node="childnode", :parent="props.node", :depth="props.depth")
      span(v-if="slots.default === undefined") {{ childnode.name + '(' + childnode.id + ')' }}
    treenode(
      v-if="childnode.isFolding"
      :parent="props.node",
      :node="childnode"
      :depth="props.depth+1"
      @dragstart="onDragstart"
      @dragend="onDragend"
      @dragenter="onDragenter"
      @toggle-caret="onToggleCaret"
      @hover="onHover"
    )
      template(v-if="slots.default !== undefined" v-slot="slotProps")
        slot(:node="slotProps.node", :parent="slotProps.parent", :depth="slotProps.depth")
    ul.subtree(v-else
      :data-id="childnode.id"
      @dragenter="onDragenter($event, childnode)"
    )
</template>