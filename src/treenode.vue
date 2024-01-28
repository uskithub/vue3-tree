<script setup lang="ts" generic="T extends BaseEditableTreenode<any>">
import { useSlots } from "vue";
import type { BaseEditableTreenode, TreenodeEvents, TreenodeEventHandlers } from "./treenode";

// custom directive for autofocus
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const props = defineProps<{
    parent : T | undefined;
    node : T;
    depth : Number;
    endEditingClosureBuilder : (node: T) => (newName: string) => void;
}>();

const slots = useSlots();

// @note: stateを一箇所に集めないと処理上の様々なな判断が困難なため、stateの保持および処理はRootコンポーネント（tree）で行い、
//        子ノード（treenode）ではイベントを発火させるだけとする。記述を簡潔にするためにコンポーネントを分けて実装する。

const emit = defineEmits<TreenodeEvents<T>>();

const handlers: TreenodeEventHandlers<T> = {
    "dragenter" : (e: DragEvent, _treenode: T) => emit("dragenter", e, _treenode)
    , "dragstart" : (e: DragEvent, parent: T, _treenode: T) => emit("dragstart", e, parent, _treenode)
    , "dragend" : (e: DragEvent, _treenode: T) => emit("dragend", e, _treenode)
    , "dragenter-temporarily-open" : (e: DragEvent, _treenode: T) => emit("dragenter-temporarily-open", e, _treenode)
    , "mouse-leave" : (e: MouseEvent, _treenode: T) => emit("mouse-leave", e, _treenode)
    , "toggle-folding" : (e: MouseEvent, id: string) => emit("toggle-folding", e, id)
    , "toggle-editing" : (e: MouseEvent, id: string, isEditing: boolean) => emit("toggle-editing", e, id, isEditing)
    , "hover" : (e: MouseEvent, id: string, isHovering: boolean) => emit("hover", e, id, isHovering)
}
</script>

<template lang="pug">
ul.subtree(
  :data-id="props.node.id"
  @dragenter="handlers['dragenter']($event, props.node)"
)
  li(
    v-for="childnode in props.node.subtrees",
    :key="childnode.id", 
    :data-id="childnode.id", 
    :draggable="childnode.isDraggable"
    :class="{ freeze : !childnode.isDraggable, ...childnode.styleClass }"
    @dragstart.stop="handlers['dragstart']($event, props.node, childnode)"
    @dragend.stop="handlers['dragend']($event, childnode)"
  )
    .tree-item(
      @dblclick.prevent="handlers['toggle-editing']($event, childnode.id, true)"
      @mouseover.prevent.stop="handlers['hover']($event, childnode.id, true)"
      @mouseout.prevent.stop="handlers['hover']($event, childnode.id, false)"
      @dragenter="handlers['dragenter-temporarily-open']($event, childnode)"
      @mouseleave.stop="handlers['mouse-leave']($event, childnode)"
    )
      i.mdi(
        v-if="childnode.subtrees.length > 0"
        :class="childnode.isFolding ? 'mdi-menu-right' : 'mdi-menu-down'"
        @click.prevent.stop="emit('toggle-folding', $event, childnode.id)"
      )
      i.mdi.mdi-circle-small(v-else)
      slot(
        :node="childnode",
        :parent="props.node",
        :depth="props.depth",
        :isHovering="childnode.isHovering===true",
        :isEditing="childnode.isEditing===true",
        :endEditing="(shouldCommit: boolean, newValue?: InnerTreenode<T>) => (props.endEditingClosureBuilder(childnode))(shouldCommit, newValue)"
      )
      span(v-if="slots.default === undefined && !childnode.isEditing") {{ childnode.name + '(' + childnode.id + ')' }}
      input(
        v-if="slots.default === undefined && childnode.isEditing"
        v-model="childnode.name"
        v-focus
        @blur="handlers['toggle-editing']($event, childnode.id, false)" 
      )
    treenode(
      v-if="!childnode.isFolding || childnode.subtrees.length === 0"
      :parent="props.node",
      :node="childnode"
      :depth="props.depth+1"
      :endEditingClosureBuilder="props.endEditingClosureBuilder"
      @dragenter="handlers['dragenter']"
      @dragstart="handlers['dragstart']"
      @dragend="handlers['dragend']"
      @dragenter-temporarily-open="handlers['dragenter-temporarily-open']"
      @mouse-leave="handlers['mouse-leave']"
      @toggle-folding="handlers['toggle-folding']"
      @toggle-editing="handlers['toggle-editing']"
      @hover="handlers['hover']"
    )
      template(v-if="slots.default !== undefined" v-slot="slotProps")
        slot(
          :node="slotProps.node",
          :parent="slotProps.parent",
          :depth="slotProps.depth",
          :isHovering="slotProps.isHovering",
          :isEditing="slotProps.isEditing",
          :endEditing="slotProps.endEditing"
        )
</template>