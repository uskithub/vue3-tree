# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). While the
version stays below 1.0.0, breaking changes ship in minor releases — see D-9 in
[docs/SPEC.md](./docs/SPEC.md).

## [0.2.1] - 2026-11-27

### Changed

- Dropping onto a row now depends on where in the row the pointer is. The top quarter
  inserts before that row and the bottom quarter inserts after it, both as siblings; the
  middle still drops into the row as a child. Previously every position on a row meant
  "child", so a drop between siblings needed a gap between rows to aim at, and was
  impossible when the consuming app styled the gaps away. The `rearrange` payload and
  its timing are unchanged. See D-12 in [docs/SPEC.md](./docs/SPEC.md).

- The dotted frame around the drop target is drawn with `outline` instead of `border`,
  so rows inside it no longer shift by the width of the frame. See D-13.

## [0.2.0] - 2026-09-22

### Changed

- The package is published to npm as `vue3-dnd-tree`. The name `vue3-tree` belongs to
  an unrelated project on npm, so imports and the UMD global (`Vue3DndTree`) use the
  new name.

- **Breaking.** The plugin registers its components as `Vue3Tree` and `Vue3Treenode`
  instead of `tree` and `treenode`. `V*` is Vuetify's namespace, so a package-derived
  prefix keeps the two apart.

  ```diff
  - <tree :node="root" :version="version" />
  + <Vue3Tree :node="root" :version="version" />
  ```

  To choose your own names, pass
  `createVue3Tree({ components: { tree: "MyTree", treenode: "MyTreenode" } })`.

- **Breaking.** Removed the legacy `tree` export. The component is exported as `VTree`.

  ```diff
  - import { tree } from "vue3-tree";
  + import { VTree } from "vue3-dnd-tree";
  ```

### Fixed

- The default slot is now typed. Using `#default` from TypeScript failed with
  `Property 'default' does not exist on type '{}'`: `useSlots()` does not surface a
  slot type, and vue-tsc does not infer one from the template.
- The `GlobalComponents` augmentation is now actually published. It lived in a
  standalone `.d.ts`, which vue-tsc does not re-emit, so it never reached
  `dist/types`. Consumers got no types for the globally registered components — they
  could omit required props with no error — and `dist/types/index.d.ts` carried an
  unresolvable `import "./global.d.ts"`.

### Removed

- The `modification has not reflected.` marker shown on the root subtree until
  `version` was incremented. It was a development aid, not something to render in a
  consuming app.
- Debug `console.log` calls in `tree.vue` and `treenode.ts`.

## [0.1.0]

Initial release. Not published to npm.
