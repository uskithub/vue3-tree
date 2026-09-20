# vue3-tree

Vue 3 / Vuetify 3 向けの、ドラッグ&ドロップで並べ替えできるツリーコンポーネントを提供するライブラリ。

## ドキュメント運用

このリポジトリは3つのファイルで状態を管理する。役割を混ぜないこと。

- `docs/SPEC.md` — 仕様と決定の根拠。What と Why。
- `docs/TASK-TREE.md` — 現在地。階層タスクとステータス。
- `CLAUDE.md`（このファイル）— ルールのみ。

守ること:

1. 実装に着手する前に `docs/SPEC.md` の該当節を読む。
2. 仕様が変わったら、コードより先に `docs/SPEC.md` を直す。
3. タスクの状態が変わったら、そのターンのうちに `docs/TASK-TREE.md` を更新する。完了報告と同時に行う。
4. `docs/SPEC.md` に書かれていない判断を迫られたら、実装せずに確認する。推測で埋めない。

## コマンド

```bash
yarn install      # 依存の導入（Yarn 4 / nodeLinker: node-modules）
yarn dev          # sandbox/ を Vite で起動（index.html → sandbox/main.ts）
yarn vitest run   # テスト（`yarn test` は watch モードなので CI/確認では使わない）
yarn typecheck    # 型チェック。lint は未導入なので、これが代わり
yarn build        # typecheck → dist 削除 → vite build → 型定義出力
```

作業完了を報告する前に、少なくとも `yarn vitest run` と `yarn typecheck` を通すこと。

## このプロジェクト固有の注意

- ルート1段目のマークアップは `src/tree.vue` の template に、2段目以降は `src/treenode.vue` に **重複して** 書かれている。ツリー項目の見た目やイベント配線を変えたら必ず両方を直す。片方だけ直すと「ルートだけ挙動が違う」バグになる。
- state は root（`tree.vue`）に集約する。`treenode.vue` は emit するだけで状態を持たせない。D&D の判断材料が分散すると制御が破綻するため。
- `defineProps<TreeProps<U, T>>()` と書けない。vue/compiler-sfc がジェネリック型参照を解決できずビルドが落ちるので、`tree.vue` では型をインラインで展開する（コメント済み）。
- `reactive<State>({...}) as State` の `as State` を外さない。外すと `T` が `UnwrapRef<T>` になって型が壊れる。
- 外部から渡された `props.node` は `InnerTreenode` にコピーして内部で保持する。外部のツリーを直接書き換えない。外部側の変更を内部へ反映させるには `version` prop をインクリメントする。
- ドロップ先の判定は DOM 構造（`ul.subtree` と `data-id`）とクラス名（`tree-header` / `tree-item` / `subtree` / `mirage` / `drop-target`）に依存している。これらはイベントハンドラの分岐条件そのものなので、スタイル都合で改名しない。
- ドラッグ中は mirage（ドラッグ元の li のクローン）が DOM に挿入され、`data-id` が重複する。`data-id` で要素を引くコードやテストは、`.mirage` を除外するか、ドラッグ開始前に掴んだ参照を使う。
- template は pug。`@vue/language-plugin-pug` 経由で vue-tsc が読むため、pug をやめると型定義の出力が壊れる。
- `tree.vue` の slot 型は `defineSlots` で明示する。`useSlots()` だけだと生成される `d.ts` の `slots` が `{}` になり、利用側の `#default` が型エラーになる（テンプレートからは推論されない）。
- `dist/` は生成物。直接編集しない。生成元は `src/`。
- ライブラリなので `vue` / `vuetify` は external。`src/` から `vuetify` を import しない（CSS 変数 `--v-theme-*` の参照に留める）。`@mdi/font` の CSS は利用側で import させる。
