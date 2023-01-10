<script setup lang="ts">
// view
import treenode from "./treenode.vue";

import type { Treenode } from "./treenode";
import { nextTick, reactive, useSlots } from "vue";

const props = defineProps<{
  node: Treenode
}>();

const slots = useSlots();

// @note: stateを一箇所に集めないと処理上の様々なな判断が困難なため、stateの保持および処理はRootコンポーネント（tree）で行い、
//        子ノード（treenode）ではイベントを発火させるだけとする。記述を簡潔にするためにコンポーネントを分けて実装する。

const emit = defineEmits<{
  (e: "dragenter", event: MouseEvent, node: Treenode): void,
  (e: "arrange", node: Treenode, from: { id: string, node: Treenode }, to: { id: string, node: Treenode }, index: number): void
  (e: "toggle-folding", node: Treenode): void
}>();

const getNodeById = (id: string, node: Treenode): Treenode | null => {
  // 終了条件
  if (node.id === id) return node;
  if (node.subtrees.length === 0) {
    return null;
  }

  for (let i = 0; i < node.subtrees.length; i++) {
    const n = node.subtrees[i];
    const ret = getNodeById(id, n);
    if (ret !== null) return ret;
  }
  return null;
};

/**
 * targetUl が ofElem 自身かその子孫の場合 true を返します。
 * @param targetUl 
 * @param ofElem 
 */
const isMyselfOrDescendant = (targetUl: HTMLElement, ofElem: HTMLElement) => {
  if (targetUl === ofElem) {
    return true;
  }
  if (ofElem.childNodes) {
    for (const i in ofElem.childNodes) {
      const child = ofElem.childNodes[i];
      if (child instanceof HTMLElement)
        if (child instanceof HTMLElement && isMyselfOrDescendant(targetUl, child)) {
          return true;
        }
    }
  }
  return false;
};

/**
 * parent の子要素のうち、座標 y を挟む要素をタプルで返します。
 * @param parent 
 * @param y 
 */
const getInsertingIntersiblings = (parent: HTMLElement, y: number): [HTMLElement | null, HTMLElement | null] => {
  const len = parent.children.length;
  for (let i = 0; i < len; i++) {
    const child = parent.children[i] as HTMLElement;
    const rect = child.getBoundingClientRect();
    if ((rect.top + rect.height / 2) > y) {
      if (i > 0) {
        const before = parent.children[i - 1] as HTMLElement;
        return [before, child];
      } else {
        return [null, child];
      }
    }
  }
  return [parent.children[len - 1] as HTMLElement, null];
};

const state = reactive<{
  dragging: {
    elem: HTMLElement;
    parent: Treenode;
    node: Treenode;
    mirage: HTMLElement;
  } | null;
  draggingOn: {
    elem: HTMLElement;
    id: string;
    node: Treenode;
    siblings: [HTMLElement | null, HTMLElement | null] | null;
  } | null;
}>({
  dragging: null
  , draggingOn: null
});

/**
 * dragされた要素をdrag状態にします（スタイルを変えます）。
 * @param e 
 * @param parent 
 * @param node 
 */
const onDragstart = (e: MouseEvent, parent: Treenode, node: Treenode) => {
  const elem = e.target as HTMLElement
    , mirage = elem.cloneNode(true) as HTMLElement
    ;
  elem.classList.add("dragging");
  mirage.classList.add("mirage");

  state.dragging = {
    elem
    , parent
    , node
    , mirage
  };
}

/**
 * ※ 対象のelemのcontentが空の場合、paddingなどで領域がないとenterしないので注意
 * ※ イベントを発火させたnodeを拾うため、各ULにイベントが発火するようにしている
 * @param e 
 * @param node イベントを発火させたnode
 */
const onDragenter = (e: DragEvent, node: Treenode) => {

  const elem = e.target as HTMLElement
    , id = elem.dataset.id
    , y = e.clientY
    ;

  // イベントを発火させたULへのdragenterのみ処理する
  // イベントを発火させたnodeを拾うため、各ULにdragenterを仕込んでいて何重にもdragenterが呼ばれている
  if (id !== node.id) return;

  if (id === undefined || state.dragging === null) return;

  // dragenterした対象がmirage（drop targetの虚像）または自身（dragging）の子孫のULの場合は何もしない
  if (isMyselfOrDescendant(elem, state.dragging.mirage) || isMyselfOrDescendant(elem, state.dragging.elem)) return;

  if (state.draggingOn) {
    state.draggingOn.elem.classList.remove("drop-target");
    state.draggingOn.elem.removeEventListener("dragover", onDragover);
    state.draggingOn = null;
  }

  elem.classList.add("drop-target");
  elem.addEventListener("dragover", onDragover);

  state.draggingOn = {
    elem
    , id
    , node
    , siblings: null
  };

  const mirage = state.dragging.mirage;
  const siblings = getInsertingIntersiblings(elem, y);

  // 既にmirageがある場合は何もしない
  if (siblings.includes(mirage)) return;

  if (mirage.parentNode) mirage.parentNode.removeChild(mirage);
  if (siblings.includes(state.dragging.elem)) return;

  elem.insertBefore(mirage, siblings[1]);
  state.draggingOn.siblings = siblings;
};

/**
 * dragしている要素がホバーしているsiblingsが変わった場合にmirageを移動させstateのsiblingsを更新します。
 * @param e 
 */
const onDragover = (e: MouseEvent) => {
  const elem = e.currentTarget as HTMLElement
    , y = e.clientY
    ;

  if (state.dragging === null) return;

  // dragenterした対象がmirage（drop targetの虚像）または自身（dragging）の子孫のULの場合は何もしない
  if (isMyselfOrDescendant(elem, state.dragging.mirage) || isMyselfOrDescendant(elem, state.dragging.elem)) return;

  const mirage = state.dragging.mirage;
  const siblings = getInsertingIntersiblings(elem, y);

  // 既にmirageがある場合は何もしない
  if (siblings.includes(mirage)) return;
  // siblingsの片割れがdraggingの場合は何もしない
  if (siblings.includes(state.dragging.elem)) return;

  // siblingsが変わった場合
  if (state.draggingOn && state.draggingOn.siblings !== siblings) {
    if (mirage.parentNode) {
      mirage.parentNode.removeChild(mirage);
    }
    elem.insertBefore(mirage, siblings[1]);
    state.draggingOn.siblings = siblings;
  }
};

const onDragend = (e: MouseEvent) => {
  const elem = e.currentTarget as HTMLElement; // must be same as `state.dragging.elem`
  elem.classList.remove("dragging");

  if (state.dragging === null || state.draggingOn === null) return;

  const node = state.dragging.node;
  const exPrarentNode = state.dragging.parent;
  const mirage = state.dragging.mirage;
  const exParent = elem.parentNode as HTMLElement;
  const newParent = state.draggingOn.elem;

  console.log(state.draggingOn)

  if (exParent.dataset.id === undefined) return;

  let index = 0;
  for (let i = 0, len = newParent.children.length; i < len; i++) {
    const child = newParent.children[i];
    if (child === mirage) break;
    if (child !== elem) index++;
  }

  emit("arrange", node
    , { id: exParent.dataset.id, node: exPrarentNode }
    , { id: state.draggingOn.id, node: state.draggingOn.node }
    , index
  );

  nextTick()
    .then(() => {
      if (mirage.parentNode) mirage.parentNode.removeChild(mirage);

      newParent.classList.remove("drop-target");
      newParent.removeEventListener("dragover", onDragover);
    });

  state.dragging = null;
  state.draggingOn = null;
}

const onToggleCaret = (e: MouseEvent, id: string) => {
  const node = getNodeById(id, props.node);
  if (node === null) return;
  emit("toggle-folding", node);
};
</script>

<template lang="pug">
ul.tree(
  :data-id="props.node.id"
  @dragenter="onDragenter($event, props.node)"
)
  li(
    v-for="childnode in props.node.subtrees",
    :key="childnode.id", 
    :data-id="childnode.id", 
    :draggable="childnode.isDraggable"
    :class="{ freeze : !childnode.isDraggable }"
    @dragstart="onDragstart($event, props.node, childnode)"
    @dragend="onDragend($event)"
  )
    .tree-item
      v-icon(v-if="childnode.subtrees.length > 0" @click.prevent="onToggleCaret($event, childnode.id)") {{ childnode.isFolding ? "mdi-menu-down" : "mdi-menu-right" }}
      v-icon(v-else) {{ "mdi-circle-small" }}
      slot(:node="childnode", :parent="props.node", :isTopLevel="true")
      span(v-if="slots.default === undefined") {{ childnode.name + '(' + childnode.id + ')' }}
    treenode(
      v-if="childnode.isFolding"
      :parent="props.node",
      :node="childnode"
      @dragstart="onDragstart"
      @dragend="onDragend"
      @dragenter="onDragenter"
      @toggle-caret="onToggleCaret"
    )
      template(v-if="slots.default !== undefined" v-slot="slotProps")
        slot(:node="slotProps.node", :parent="slotProps.parent", :isTopLevel="false")
    ul.subtree(v-else
      :data-id="childnode.id"
      @dragenter="onDragenter($event, childnode)"
    )
</template>

<style lang="sass" scoped>
.tree
  list-style-type: none
  margin: 0
  padding: 0 0 0 1em !important
  border-top: 3px solid transparent
  border-left: 3px solid transparent

  &.drop-target
    border: 3px dotted #888

  // https://v3.ja.vuejs.org/api/sfc-style.html#style-scoped
  :deep(li)
    margin: 0
    padding: 0
    position: relative
    min-height: 2.5em
    overflow: hidden

    &.dragging
      opacity: 0.5
    &.mirage
      opacity: 0.5
      color: #f00

    &.freeze
      background: #eee
    .tree-item
      height: 2.5em
      padding: 0.5em 0.5em 0 0em
      
    .subtree
      list-style-type: none
      margin: 0 0 0 1em
      padding: 0.5em 0 0 0.5em
      min-height: 50px
      border-top: 3px solid transparent
      border-left: 3px solid transparent

      &:empty
        margin: 0
        min-height: 7px

      &.drop-target
        border: 3px dotted #888
</style>