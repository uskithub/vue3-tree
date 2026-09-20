# SPEC — vue3-tree

最終更新: 2026-09-20

このファイルは仕様の Single Source of Truth。実装がここと食い違ったら、どちらが正しいかを決めてから直す。黙って実装に合わせない。

## 1. 目的

### 1.1 解決する課題

Vue 3 / Vuetify 3 のアプリで、階層データをツリー表示し、ドラッグ&ドロップで並べ替え・親子付け替えができる UI を、毎回アプリ側で書き直さずに済むようにする。Vuetify の treeview はドラッグ&ドロップでの再配置に対応していない。

「並べ替えの見た目と操作感」はライブラリが持ち、「データをどう持つか」は利用側が決める、という分担にする。

### 1.2 対象ユーザー

Vue 3（+ Vuetify 3）でアプリを作る開発者。自前のドメインモデル（タスク、フォルダ、組織図など）をそのままツリーに流し込みたいケースを想定する。

### 1.3 やらないこと

- 仮想スクロール・遅延ロードなど、数千ノード規模のパフォーマンス対策。
- 複数選択、チェックボックス選択。`select` は単一ノードのみを対象とする。
- キーボード操作・ARIA tree role などのアクセシビリティ対応（現時点では対象外。→ 5. 未決事項）。
- ツリーデータの永続化・サーバ同期。イベントを受け取った利用側の責務とする。

## 2. 要件

### 2.1 機能要件

| ID | 要件 | 優先度 |
|---|---|---|
| R-1 | 任意のドメインモデルを `BaseUpdatableTreenode<T>` の派生クラスとして渡すと、ツリーとして描画される | 必須 |
| R-2 | ノードをドラッグして、兄弟間の順序変更・別ノードの子への移動ができる。確定時に `rearrange` を emit する | 必須 |
| R-3 | 折り畳み・展開ができる。`toggle-folding` を emit する | 必須 |
| R-4 | ドラッグ中に折り畳まれたノードへ一定時間ホバーすると自動展開する | 必須 |
| R-5 | ダブルクリックでノード名をインライン編集できる。`toggle-editing` / `update-name` を emit する | 必須 |
| R-6 | ノードのクリックで `select`、ツリー外のクリックで `select(undefined)` を emit する | 必須 |
| R-7 | default slot でノードの描画を利用側が完全に差し替えられる | 必須 |
| R-8 | Vue プラグインとして `app.use()` でグローバル登録できる。個別 import も可能 | 必須 |
| R-9 | `isDraggable: false` のノードはドラッグ対象から外れる | 任意 |

### 2.2 非機能要件

- パフォーマンス: 数百ノード規模で操作が破綻しないこと。それ以上は 1.3 のとおり対象外。
- 対応環境: Vue ^3.3 / Vuetify ^3（optional） / モダンブラウザ（HTML5 Drag and Drop API と Web Animations API を使う）。
- 配布形態: ESM + UMD + 型定義。`vue` / `vuetify` は peerDependency かつ bundle から external。
- スタイル: `dist/vue3-tree.css` として別出し。`@mdi/font` の読み込みは利用側の責務。

## 3. 設計

### 3.1 全体像

- `src/tree.vue` — ルートコンポーネント。**すべての state と全イベントの処理をここに集約する。** 1 段目のノードを自前で描画し、2 段目以降を `treenode.vue` に委譲する。
- `src/treenode.vue` — 再帰コンポーネント。描画と emit だけを行い、state を持たない。
- `src/treenode.ts` — ノードの抽象基底クラスと、内部/外部それぞれのイベント型定義。
- `src/tree.ts` — `tree` コンポーネントの props / events 型。
- `src/plugin.ts` — `app.use()` 用のプラグイン定義。

### 3.2 データモデル

利用側は `BaseUpdatableTreenode<T>` を継承したクラスを渡す。必須メンバは `id` / `content` / `name` / `styleClass` / `subtrees` / `isDraggable`、および `update(newContent)`。`isFolding` は基底クラスが持つ。

`tree.vue` は受け取ったノードを `InnerTreenode`（`BaseEditableTreenode` の具象）へ**再帰的にコピー**して内部状態とする。内部状態には `isEditing` / `isHovering` という表示専用のフラグが増える。

利用側のデータが外部で変わった場合は `version` prop をインクリメントする。`watch(() => props.version)` が内部ツリーを作り直す。

### 3.3 インターフェース

props:

```ts
{ node: T; version: number }
```

events（`TreeEventHandlers<U, T>` として export）:

```ts
{
  "rearrange"      : [targetId: string, from: string, to: string, index: number]
  "toggle-folding" : [id: string]
  "toggle-editing" : [id: string, isEditing: boolean]
  "update-name"    : [id: string, newValue: string]
  "select"         : [node: T | undefined]
}
```

default slot props:

```ts
{ node, parent, depth, isHovering, isEditing, endEditing(shouldCommit: boolean) }
```

## 4. 決定記録

**ここがこのファイルで最も価値のある節。** 採用した案だけでなく、却下した案とその理由を残す。

### D-1: state をルートコンポーネントに集約する

- 日付: 2026-09-20（実装時のコメントから起こした）
- 決定: ドラッグ中の state（`dragging` / `draggingOn` / `temporarilyOpen` / `reserve`）とすべてのハンドラを `tree.vue` に置き、`treenode.vue` は emit のみ行う。
- 理由: 「どこからどこへ移動しようとしているか」の判断には、ドラッグ元・ドロップ先・祖先関係を同時に見る必要がある。state が各ノードに分散すると判断が書けない。
- 却下した案: 各 `treenode` がローカル state を持つ再帰実装 — ノード間の通信が provide/inject か emit の多段リレーになり、結局ルートに集めるのと変わらないうえ追跡不能になる。
- 覆す条件: ドラッグ処理を composable（`useDragAndDrop`）へ切り出す場合。その場合も state の置き場所はひとつに保つ。

### D-2: 外部ノードを内部でコピーして保持する

- 日付: 2026-09-20
- 決定: `props.node` を `InnerTreenode` に deep copy し、表示用フラグ（`isEditing` / `isHovering`）は内部コピーにだけ持たせる。外部への反映は emit したイベントを利用側が処理することで行う。
- 理由: 利用側のドメインモデルに UI 都合のフラグを混ぜたくない。また、ドロップが確定するまでは外部のデータを変更したくない。
- 却下した案: `props.node` を直接 mutate する — 利用側のモデルが UI の中間状態で汚れ、取り消しもできない。
- 覆す条件: 巨大ツリーでコピーコストが問題になった場合。その際は差分適用に切り替える。

### D-3: 外部からの更新反映は `version` prop で行う

- 日付: 2026-09-20
- 決定: 内部ツリーの再構築トリガーを `version: number` の変化とする。
- 理由: D-2 により内部はコピーなので、外部の変更を自動検知できない。ツリー全体を deep watch すると、ドラッグ中の内部変更と区別がつかず無限ループの温床になる。
- 却下した案: `watch(props.node, { deep: true })` — 上記のとおり。
- 覆す条件: 内部状態を持たない設計に変えた場合。

### D-4: Vuetify は optional peerDependency とする

- 日付: 2026-09-20
- 決定: `vuetify` と `@mdi/font` を optional な peerDependency にし、bundle からは external にする。スタイルは `--v-theme-on-surface` など Vuetify のテーマ変数を参照するに留める。
- 理由: Vuetify アプリに馴染ませたいが、バージョンを固定して利用側と衝突させたくない。
- 却下した案: Vuetify コンポーネント（`v-list` など）で組む — テーマには馴染むが、D&D で必要な DOM 構造を自由に作れない。
- 覆す条件: 5. の「Vuetify 非依存化」が決まった場合。

### D-5: `dragleave` ではなく `mouseleave` で自動展開をキャンセルする

- 日付: 2026-09-20
- 決定: 折り畳みノードの自動展開タイマーの取り消しには `mouseleave` を使う。
- 理由: `dragleave` は子要素に入った時にも発火するため、ノード内を移動しただけでキャンセルされてしまう。
- 却下した案: `dragleave` + 座標判定 — 判定が複雑なわりに取りこぼす。
- 覆す条件: なし（ブラウザ仕様由来）。

## 5. 未決事項

決まっていないことを明示する。ここにある項目は実装してはいけない。

- [ ] Vuetify 非依存化をするか。現状 peerDependency は optional だが、スタイルは `--v-theme-*` と mdi アイコンに依存している。非依存化するなら CSS 変数のフォールバックとアイコンの差し替え口が要る。
- [ ] アクセシビリティ（キーボード操作 / ARIA tree role）を将来スコープに入れるか。入れるなら D&D 以外の並べ替え手段が必要になる。
- [ ] `select` の対象が単一ノードのままでよいか（複数選択の需要が出たら 1.3 の見直し）。
- [ ] 公開時のバージョニング方針（0.x のまま破壊的変更を許容するか、semver を厳密に守るか）。
