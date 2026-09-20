# TASK TREE — vue3-tree

最終更新: 2026-09-20

作業の現在地。タスクの状態が変わったら、そのターンのうちにここを更新する。

## 記法

- ステータス: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` ブロック中 / `[-]` 取り止め
- 各タスクには ID を振る。会話では ID で指す（例: 「T-2.1 を進めて」）。
- `→ SPEC 3.2` のように、根拠となる [SPEC.md](./SPEC.md) の節番号を書く。節が無いタスクは、仕様が未定か、そもそも不要なタスク。
- `[!]` には必ず理由を書く。理由の無いブロックは放置される。

## 現在のフォーカス

**T-4** — テストを通る状態にする

## マイルストーン 1: v0.2.0 を npm に公開する

- [x] **T-1** README を現行 API に追従させる → SPEC 3.3
  - [x] T-1.1 使用例を `BaseUpdatableTreenode<T>` の派生クラスに書き換える（現 README は廃止済みの `Treenode` 型リテラルのまま）
  - [x] T-1.2 props に `version` を追加し、外部更新の反映手順を書く → SPEC 3.2
  - [x] T-1.3 events を `rearrange` / `toggle-folding` / `toggle-editing` / `update-name` / `select` に差し替える（現 README の `arrange` / `hover` / `dragenter` は実在しない）
  - [x] T-1.4 slot props を `node` / `parent` / `depth` / `isHovering` / `isEditing` / `endEditing` に更新する
  - [x] T-1.5 プラグイン登録（`createVue3Tree` / `app.use`）とスタイル・mdi の読み込み手順を追記する
- [x] **T-2** 公開する API を確定させる → SPEC 3.3
  - [x] T-2.1 `src/index.ts` の後方互換 export（`tree`）を残すか決める。残すなら README に書き、消すなら破壊的変更として記録する
  - [x] T-2.2 デバッグ用 `console.log` を除去する（`src/tree.vue`、`src/treenode.ts`）
  - [x] T-2.3 `.subtree.modified:before` の "modification has not reflected." 表示が仕様か開発用かを決める → SPEC 2.1
- [x] **T-3** ビルドと型定義の出力を検証する → SPEC 2.2
  - [x] T-3.1 `yarn build` を通し、`dist/types` の出力内容を確認する
  - [x] T-3.2 外部プロジェクトから ESM / UMD 双方で import し、型が効くことを確認する（`node_modules/vue3-tree` を自身へのリンクにした consumer で検証。props・events・slot すべて型が効くこと、ESM / UMD の export が一致することを確認）
  - [x] T-3.3 `tree.vue` に `defineSlots` を追加し、`d.ts` の `slots` が `{}` になる問題を直す（T-3.2 で発見。R-7 が TypeScript 利用者に対して満たせていなかった）
- [ ] **T-4** テストを通る状態にする → SPEC 2.1
  - [x] T-4.1 テストを通す（2026-09-20、T-2 の検証として実施。テスト 1 件パス、スナップショット更新は不要だった。`test/tree.spec.ts` の import 名のずれは T-2.1 の対応で解消済み）
  - [ ] T-4.2 `rearrange` / `select` / `update-name` の振る舞いテストを追加する
- [ ] **T-5** 公開する → SPEC 2.2
  - [ ] T-5.1 `package.json` の version を 0.2.0 にする
  - [ ] T-5.2 `npm publish`（`prepublishOnly` で build が走る）
  - [ ] T-5.3 git tag と GitHub release を作る

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。

<!-- 例: ## マイルストーン 0: 環境構築（2026-09-20 完了） -->

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら [SPEC.md](./SPEC.md) の未決事項か正式なタスクに昇格させる。

- `src/tree.vue` の 1 段目と `src/treenode.vue` の 2 段目以降でマークアップが重複している。共通化したいが、ルートだけ `.tree-header`、以降は `.tree-item` とクラスが異なり、単純には括り出せない。
- lint / formatter が未導入。`yarn typecheck` が事実上の代わりになっている。
- ドラッグ処理が `tree.vue` に 700 行超で集中している。composable への切り出しは D-1 の「state はひとつ」を壊さない範囲で検討する。
- イベントとスロットに渡るノードは内部コピー（`InnerTreenode`）で、利用側クラスで定義したメソッドを持たない。一方、公開型 `TreeEventHandlers<U, T>` は `T` が渡る形になっており、型と実体がずれている。README には実態を注記した。
