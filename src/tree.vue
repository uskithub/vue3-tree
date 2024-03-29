<script setup lang="ts" generic="T extends Treenode<any>">
// view
import type { TreeEvents } from "./tree";
import treenode from "./treenode.vue";
import type { Treenode, TreenodeEventHandlers, Mutable } from "./treenode";
import { findNodeById } from "./treenode";
import { nextTick, reactive, useSlots, watch } from "vue";
import "@mdi/font/css/materialdesignicons.css";
import rdfc from "rfdc";

// custom directive for autofocus
const vFocus = {
    mounted: (el: HTMLElement) => el.focus()
};

const props = defineProps<{
    node : T
}>();

const slots = useSlots();

// @note: stateを一箇所に集めないと処理上の様々なな判断が困難なため、stateの保持および処理はRootコンポーネント（tree）で行い、
//        子ノード（treenode）ではイベントを発火させるだけとする。記述を簡潔にするためにコンポーネントを分けて実装する。

const emit = defineEmits<TreeEvents<T>>();

const _deepCopy = rdfc();
const deepCopy = (node: T): T => {
    const _recursive = (node: T): T => {
        const tmp = {
            id: node.id
            , name: node.name
            , styleClass: node.styleClass
            , content: node.content
            , subtrees: node.subtrees.map(n => _recursive(n))
            , isDraggable: node.isDraggable
            , isFolding: node.isFolding
        } as T;
        return _deepCopy(tmp);
    };
    return _recursive(node);
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
    tree : T;
    isModified : boolean;
    dragging : {
        elem : HTMLElement;
        parent : T;
        node : T;
        mirage : HTMLElement;
    } | null;
    draggingOn : {
        elem : HTMLElement;
        id : string;
        node : T;
        siblings : [HTMLElement | null, HTMLElement | null] | null;
    } | null;
    temporarilyOpen : {
        node : T;
        timerId : number;
    } | null;
    reserve: T | null;
}>({
    tree: deepCopy(props.node)
    , isModified: false
    , dragging: null
    , draggingOn: null
    , temporarilyOpen: null
    , reserve : null
}) as { // 型を指定してあげないと、T が UnwrapRef<T> になってしまう
    tree : T; // @see: https://v3.ja.vuejs.org/api/refs-api.html#ref, https://am-yu.net/2022/11/13/vue3_ref_generics/s
    isModified : boolean;
    dragging : {
        elem : HTMLElement;
        parent : T;
        node : T;
        mirage : HTMLElement;
    } | null;
    draggingOn : {
        elem : HTMLElement;
        id : string;
        node : T;
        siblings : [HTMLElement | null, HTMLElement | null] | null;
    } | null;
    temporarilyOpen : {
        node : T;
        timerId : number;
    } | null;
    reserve: T | null;
};

watch(() => props.node, (newVal: T) => {
    state.isModified = false;
    state.tree = deepCopy(newVal);
});

/**
 * dragしている要素がホバーしているsiblingsが変わった場合にmirageを移動させstateのsiblingsを更新します。
 * @param e 
 */
const onDragover = (e: MouseEvent) => {
    const elem = e.currentTarget as HTMLElement
        , y = e.clientY;

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

const endEditingClosureBuilder = (node: T): (shouldCommit: boolean, newValue?: T) => void => {
    return (shouldCommit: boolean, newValue?: T) => {
        const mutableNode = node as Mutable<T>;
        mutableNode.isEditing = false;
        if (shouldCommit && newValue) { // 更新あり
            state.reserve = null;
            state.isModified = true;
            emit("update-node", newValue);
        } else { // 更新なし
            if (state.reserve === null) return;
            (Object.keys(state.reserve) as (keyof T)[]).forEach(key => {  
                mutableNode[key] = (state.reserve as T)[key];
            });
            state.reserve = null;
        }
    };
};

const handlers: TreenodeEventHandlers<T> = {
    /**
     * ※ 対象のelemのcontentが空の場合、paddingなどで領域がないとenterしないので注意
     * ※ イベントを発火させたnodeを拾うため、各ULにイベントが発火するようにしている
     * @param e 
     * @param node イベントを発火させたnode
     */
    "dragenter" : (e: DragEvent, node: T) => {
        const elem = e.target as HTMLElement
            , id = elem.dataset.id
            , y = e.clientY;

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
    }
    ,
    /**
     * dragされた要素をdrag状態にします（スタイルを変えます）。
     * @param e 
     * @param parent 
     * @param node 
     */
    "dragstart" : (e: MouseEvent, parent: T, node: T) => {
        const elem = e.target as HTMLElement
            , mirage = elem.cloneNode(true) as HTMLElement;
        elem.classList.add("dragging");
        mirage.classList.add("mirage");
    
        state.dragging = {
            elem
            , parent
            , node
            , mirage
        }
    }
    , "dragend" : (e: MouseEvent) => {
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

        // 元親から削除
        exPrarentNode.subtrees = exPrarentNode.subtrees.filter((subtree) => subtree.id !== node.id);
        // 新親に追加
        state.draggingOn.node.subtrees.splice(index, 0, node);
        state.draggingOn.node.isFolding = false;

        state.isModified = true;

        // emit先でエラーが起きた場合に、nextTickの処理が行われない場合があったので emitより前に書くこと
        nextTick()
            .then(() => {
                if (mirage.parentNode) mirage.parentNode.removeChild(mirage);

                newParent.classList.remove("drop-target");
                newParent.removeEventListener("dragover", onDragover);
            });

        emit("arrange", node
            , { id: exParent.dataset.id, node: exPrarentNode }
            , { id: state.draggingOn.id, node: state.draggingOn.node }
            , index
        );

        state.dragging = null;
        state.draggingOn = null;
    }
    , "dragenter-temporarily-open" : (e: DragEvent, node: T) => {
        console.log("onDragenterTemporarilyOpen", node);
        if (!node.isFolding) return; // 既に展開されている場合は何もしない
        if (state.dragging && state.dragging.node.id === node.id) return; // 自身の場合は何もしない
        if (node.subtrees.length < 1) return; // 子要素がない場合は何もしない
        if (state.temporarilyOpen && state.temporarilyOpen.node.id === node.id) return; // 既にsetTimeout設定済の
        state.temporarilyOpen = { 
            node
            , timerId: window.setTimeout(() => {
                console.log("onDragenterTemporarilyOpen.setTimeout", state.temporarilyOpen);
                if (state.temporarilyOpen) {
                    state.temporarilyOpen.node.isFolding = false;
                    state.temporarilyOpen = null;
                }
            }, 800) 
        }
    }
    ,
    /**
     * dragleaveだと、子要素に入ったときも発火してキャンセルしてしまうのでmouseleaveを使っている。
     * @param e 
     * @param node 
     */
    "mouse-leave" : (e: MouseEvent, node: T) => {
        if (state.temporarilyOpen) {
            if (state.temporarilyOpen.node.isFolding) { // まだ開かれていなかった場合はキャンセル
                clearTimeout(state.temporarilyOpen.timerId);
                state.temporarilyOpen = null;
            }
        }
    }
    , "toggle-folding" : (e: MouseEvent, id: string) => {
        const _node = findNodeById<T>(id, state.tree);
        if (_node === null) return;
        _node.isFolding = !_node.isFolding;
        emit("toggle-folding", id);
    }
    , "toggle-editing" : (e: MouseEvent, id: string, isEditing: boolean) => {
        const _node = findNodeById<T>(id, state.tree);
        if (_node === null) return;
        const mutableNode = _node as Mutable<any>;
        mutableNode.isEditing = isEditing;
        emit("toggle-editing", id, isEditing);
        if (isEditing) {
            state.reserve = deepCopy(_node);
        } else { // ここは slot を使わないときしか来ないので、name での判断でOK
            if (state.reserve === null) return;
            if (state.reserve.name === _node.name) { // 更新なし
                state.reserve = null;
            } else { // 更新あり
                state.reserve = null;
                state.isModified = true;
                emit("update-node", _node);
            }
        }
    }
    , "hover" : (e: MouseEvent, id: string, isHovering: boolean) => {
        const _node = findNodeById<T>(id, state.tree);
        if (_node === null) return;
        const mutableNode = _node as Mutable<any>;
        mutableNode.isHovering = isHovering;
    }
};

</script>

<template lang="pug">
ul.tree
  li(:data-id="state.tree.id")
    .tree-header(
      @dblclick.prevent="handlers['toggle-editing']($event, state.tree.id, true)"
      @mouseover.prevent.stop="handlers['hover']($event, state.tree.id, true)"
      @mouseout.prevent.stop="handlers['hover']($event, state.tree.id, false)"
    )
      i.mdi(
        v-if="state.tree.subtrees.length > 0"
        :class="state.tree.isFolding ? 'mdi-menu-right' : 'mdi-menu-down'"
        @click.prevent.stop="handlers['toggle-folding']($event, state.tree.id)"
      )
      i.mdi.mdi-circle-small(v-else)
      slot(
        :node="state.tree", 
        :depth="0", 
        :isHovering="state.tree.isHovering===true", 
        :isEditing="state.tree.isEditing===true",
        :endEditing="endEditingClosureBuilder(state.tree)"
      )
      span(v-if="slots.default === undefined && !state.tree.isEditing") {{ state.tree.name + '(' + state.tree.id + ')' }}
      input(
        v-if="slots.default === undefined && state.tree.isEditing"
        v-model="state.tree.name"
        v-focus
        @blur="handlers['toggle-editing']($event, state.tree.id, false)" 
      )
    ul.subtree(
      v-if="!state.tree.isFolding"
      :data-id="state.tree.id"
      :class="{ modified: state.isModified }"
      @dragenter="handlers['dragenter']($event, state.tree)"
    )
      li(
        v-for="childnode in state.tree.subtrees",
        :key="childnode.id", 
        :data-id="childnode.id", 
        :draggable="childnode.isDraggable"
        :class="{ freeze : !childnode.isDraggable, ...childnode.styleClass }"
        @dragstart="handlers['dragstart']($event, state.tree, childnode)"
        @dragend="handlers['dragend']($event)"
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
            @click.prevent.stop="handlers['toggle-folding']($event, childnode.id)"
          )
          i.mdi.mdi-circle-small(v-else)
          slot(
            :node="childnode", 
            :parent="state.tree", 
            :depth="1", 
            :isHovering="childnode.isHovering===true", 
            :isEditing="childnode.isEditing===true",
            :endEditing="endEditingClosureBuilder(childnode)"
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
          :parent="state.tree",
          :node="childnode"
          :depth="2"
          :endEditingClosureBuilder="endEditingClosureBuilder"
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

<style lang="sass" scoped>
.tree
  list-style-type: none
  margin: 0
  padding: 0 0 0 1em !important
  border-left: 3px solid transparent

  :deep(.mdi):before
    padding: 0 2px
    font-size: 1.5rem

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
      min-height: 2.5em
      padding: 0.5em 0.5em 0 0em
      
    .subtree
      list-style-type: none
      margin: 0 0 0 1em
      padding: 0 0 0 0.5em
      min-height: 50px
      border-left: 3px solid transparent

      &:empty
        margin: 0
        min-height: 7px

      &.drop-target
        border: 3px dotted #888

    .subtree.modified:before
      content: "modification has not reflected."
      color: #f00
</style>