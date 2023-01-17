<script setup lang="ts">
import type { _Treenode } from "./treenode";
import { useSlots } from "vue";

// custom directive for autofocus
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};


const props = defineProps<{
  parent: _Treenode | undefined
  , node: _Treenode
  , depth: Number
}>();

const slots = useSlots();

// @note: stateを一箇所に集めないと処理上の様々なな判断が困難なため、stateの保持および処理はRootコンポーネント（tree）で行い、
//        子ノード（treenode）ではイベントを発火させるだけとする。記述を簡潔にするためにコンポーネントを分けて実装する。

const emit = defineEmits<{
  (e: "dragenter", event: DragEvent, node: _Treenode): void,
  (e: "dragstart", event: DragEvent, parent: _Treenode, node: _Treenode): void,
  (e: "dragend", event: DragEvent, node: _Treenode): void,
  (e: "dragenter-temporarily-open", event: DragEvent, node: _Treenode): void,
  (e: "mouse-leave", event: MouseEvent, node: _Treenode): void,
  (e: "toggle-folding", event: MouseEvent, id: string): void
  (e: "toggle-editing", event: MouseEvent, id: string, isEditing: boolean): void
  (e: "hover", event: MouseEvent, id: string, isHovering: boolean): void
}>();

const onDragenter = (e: DragEvent, _Treenode: _Treenode) => emit("dragenter", e, _Treenode);
const onDragstart = (e: DragEvent, parent: _Treenode, _Treenode: _Treenode) => emit("dragstart", e, parent, _Treenode);
const onDragend = (e: DragEvent, _Treenode: _Treenode) => emit("dragend", e, _Treenode);
const onDragenterTemporarilyOpen = (e: DragEvent, _Treenode: _Treenode) => emit("dragenter-temporarily-open", e, _Treenode);
const onMouseleave = (e: MouseEvent, _Treenode: _Treenode) => emit("mouse-leave", e, _Treenode);
const onToggleFolding = (e: MouseEvent, id: string) => emit("toggle-folding", e, id);
const onToggleEditing = (e: MouseEvent, id: string, isEditing: boolean) => emit("toggle-editing", e, id, isEditing);
const onHover = (e: MouseEvent, id: string, isHovering: boolean) => emit("hover", e, id, isHovering);

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
    @dragstart.stop="onDragstart($event, props.node, childnode)"
    @dragend.stop="onDragend($event, childnode)"
  )
    .tree-item(
      @dblclick.prevent="onToggleEditing($event, childnode.id, true)"
      @mouseover.prevent.stop="onHover($event, childnode.id, true)"
      @mouseout.prevent.stop="onHover($event, childnode.id, false)"
      @dragenter="onDragenterTemporarilyOpen($event, childnode)"
      @mouseleave.stop="onMouseleave($event, childnode)"
    )
      i.mdi(
        v-if="childnode.subtrees.length > 0"
        :class="childnode.isFolding ? 'mdi-menu-right' : 'mdi-menu-down'"
        @click.prevent.stop="emit('toggle-folding', $event, childnode.id)"
      )
      i.mdi.mdi-circle-small(v-else)
      slot(:node="childnode", :parent="props.node", :depth="props.depth", :isHovering="childnode.isHovering===true", :isEditing="childnode.isEditing===true")
      span(v-if="slots.default === undefined && !childnode.isEditing") {{ childnode.name + '(' + childnode.id + ')' }}
      input(
        v-if="slots.default === undefined && childnode.isEditing"
        v-model="childnode.name"
        v-focus
        @blur="onToggleEditing($event, childnode.id, false)" 
      )
    treenode(
      v-if="!childnode.isFolding || childnode.subtrees.length === 0"
      :parent="props.node",
      :node="childnode"
      :depth="props.depth+1"
      @dragstart="onDragstart"
      @dragend="onDragend"
      @dragenter="onDragenter"
      @dragenter-temporarily-open="onDragenterTemporarilyOpen"
      @mouse-leave="onMouseleave"
      @toggle-folding="onToggleFolding"
      @toggle-editing="onToggleEditing"
      @hover="onHover"
    )
      template(v-if="slots.default !== undefined" v-slot="slotProps")
        slot(
          :node="slotProps.node",
          :parent="slotProps.parent",
          :depth="slotProps.depth",
          :isHovering="slotProps.isHovering",
          :isEditing="slotProps.isEditing"
        )
</template>