vue3-tree
==========

A tree component for Vue 3 and Vuetify 3 with drag and drop support.

- Rearrange nodes by dragging: reorder among siblings, or move under another node.
- Fold / unfold, with auto-expand while hovering a folded node during a drag.
- Inline renaming on double click.
- Bring your own domain model: extend `BaseTreenode<T>` instead of converting your data.

# Install

```bash
npm install vue3-tree
# or
yarn add vue3-tree
```

`vue`, `vuetify` and `@mdi/font` are peer dependencies. `vuetify` and `@mdi/font` are
optional, but the caret icons are rendered with Material Design Icons, and hover styles
read Vuetify theme variables, so a Vuetify app is the intended host.

# Setup

## As a plugin

```ts
import { createApp } from "vue";
import { createVue3Tree } from "vue3-tree";
import "vue3-tree/style.css";
import "@mdi/font/css/materialdesignicons.css";

const app = createApp(App);
app.use(createVue3Tree());
app.mount("#app");
```

This registers two global components, `Vue3Tree` and `Vue3Treenode`. You only use
`Vue3Tree`; `Vue3Treenode` is the recursive child it renders. Pass options to rename
them:

```ts
app.use(createVue3Tree({ components: { tree: "MyTree", treenode: "MyTreenode" } }));
```

The default export is the same plugin with the default names, so `app.use(Vue3Tree)`
also works:

```ts
import Vue3Tree from "vue3-tree";
```

## Direct import

```vue
<script setup lang="ts">
import { VTree } from "vue3-tree";
import "vue3-tree/style.css";
</script>

<template>
  <VTree :node="state.root" :version="state.version" />
</template>
```

# Defining a node

Extend `BaseTreenode<T>`, where `T` is your own content type. The component never
mutates your objects, so the class is just an adapter over the data you already have.

```ts
import { BaseTreenode } from "vue3-tree";

export type Task = {
  id: string;
  title: string;
  type: string;
  children: Task[];
};

export class TaskNode extends BaseTreenode<Task> {
  private _content: Task;
  private _subtrees: this[];

  constructor(content: Task) {
    super();
    this._content = content;
    this._subtrees = content.children.map(c => new (this.constructor as any)(c));
    this.isFolding = false; // start expanded
  }

  get id(): string { return this._content.id; }
  get name(): string { return this._content.title; }
  get content(): Task { return this._content; }
  get subtrees(): this[] { return this._subtrees; }
  get styleClass(): object | null { return { [this._content.type]: true }; }
  get isDraggable(): boolean { return true; }

  update(newContent: Task) { this._content = newContent; }
}
```

| Member | Meaning |
|---|---|
| `id` | Unique within the tree. Every event identifies nodes by this. |
| `name` | Text shown when no slot is given, and the value edited on double click. |
| `content` | Your own object. Handed back to you through the slot. |
| `subtrees` | Child nodes, same class. |
| `styleClass` | Bound to `:class` on the `li` element, or `null`. |
| `isDraggable` | `false` renders the node greyed out (`.freeze`) and not draggable. |
| `isFolding` | Provided by the base class. `true` hides the children. |

`BaseTreenode` also gives you `findNodeById(id)` and `onToggleFolding(id)`, and the
standalone `findNodeById(id, node)` is exported as well.

# Using the component

```vue
<script setup lang="ts">
import { reactive } from "vue";
import type { TreeEventHandlers } from "vue3-tree";
import { TaskNode, type Task } from "./task-node";

type State = { root: TaskNode; version: number };

// the `as State` keeps TaskNode from being unwrapped into UnwrapRef<TaskNode>
const state = reactive<State>({ root: new TaskNode(source), version: 0 }) as State;

const handlers: TreeEventHandlers<Task, TaskNode> = {
  "rearrange": (targetId, from, to, index) => {
    state.root.rearrange(targetId, from, to, index); // your own move logic
    state.version += 1;
  },
  "toggle-folding": (id) => {
    state.root.onToggleFolding(id);
  },
  "toggle-editing": (id, isEditing) => {},
  "update-name": (id, newValue) => {
    const node = state.root.findNodeById(id);
    if (node === null) return;
    node.content.title = newValue;
    state.version += 1;
  },
  "select": (node) => {
    console.log(node ? `${node.name} is selected` : "nothing is selected");
  }
};
</script>

<template>
  <Vue3Tree
    :node="state.root"
    :version="state.version"
    @rearrange="handlers['rearrange']"
    @toggle-folding="handlers['toggle-folding']"
    @toggle-editing="handlers['toggle-editing']"
    @update-name="handlers['update-name']"
    @select="handlers['select']"
  />
</template>
```

## Props

| Prop | Type | Required | Meaning |
|---|---|---|---|
| `node` | `T extends BaseTreenode<U>` | yes | The root node. |
| `version` | `number` | yes | Bump it to rebuild the tree from `node`. See below. |

## Events

```ts
{
  "rearrange"      : (targetId: string, from: string, to: string, index: number) => void
  "toggle-folding" : (id: string) => void
  "toggle-editing" : (id: string, isEditing: boolean) => void
  "update-name"    : (id: string, newValue: string) => void
  "select"         : (node: T | undefined) => void
}
```

- `rearrange` fires once a drop is committed. `targetId` is the moved node, `from` and
  `to` are the ids of the old and new parent, and `index` is the position among the new
  parent's children.
- `toggle-folding` also fires when a folded node is auto-expanded during a drag.
- `select` fires with the clicked node, and with `undefined` when a click lands outside
  any node.

`TreeEventHandlers<U, T>` is exported so you can type the whole handler set at once, as
in the example above.

## Slot

The default slot replaces the label of every node, at every depth.

```ts
type SlotProps = {
  node: T;
  parent: T | undefined;   // undefined for the root
  depth: number;           // 0 for the root
  isHovering: boolean;
  isEditing: boolean;
  endEditing: (shouldCommit: boolean) => void;
};
```

```vue
<Vue3Tree :node="state.root" :version="state.version">
  <template v-slot="slotProps">
    <input
      v-if="slotProps.isEditing"
      v-model="slotProps.node.name"
      @blur="slotProps.endEditing(true)"
    />
    <span v-else>{{ slotProps.node.name }}</span>
  </template>
</Vue3Tree>
```

`endEditing(true)` commits the edited name and emits `update-name`; `endEditing(false)`
discards it. Without a slot, the component renders `name (id)` and its own `input`.

# Reflecting external changes

The component deep-copies `node` into its own state on mount, so that your model is not
touched while a drag is still in flight, and so that display-only flags (`isEditing`,
`isHovering`) never leak into your objects. That copy is what you must keep in sync:

1. Handle `rearrange` / `update-name` by updating your own model.
2. Increment `version`.

Watching `version` is what rebuilds the internal tree. Until you do, the component keeps
showing its own copy, which no longer matches your model.

Nodes handed to event handlers and to the slot are nodes of that internal copy, not your
own instances — their `content` is the same object reference, but methods you defined on
your class are not available there. Look your own node up by `id` when you need it.

# License

Apache-2.0
