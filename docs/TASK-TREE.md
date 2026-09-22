# TASK TREE — vue3-tree

最終更新: 2026-09-22

作業の現在地。タスクの状態が変わったら、そのターンのうちにここを更新する。

## 記法

- ステータス: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` ブロック中 / `[-]` 取り止め
- 各タスクには ID を振る。会話では ID で指す（例: 「T-2.1 を進めて」）。
- `→ SPEC 3.2` のように、根拠となる [SPEC.md](./SPEC.md) の節番号を書く。節が無いタスクは、仕様が未定か、そもそも不要なタスク。
- `[!]` には必ず理由を書く。理由の無いブロックは放置される。

## 現在のフォーカス

**T-5** — 公開する

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
  - [x] T-2.4 グローバル登録名を `Vue3Tree` / `Vue3Treenode` に統一する（2026-09-22、D-8）。併せて、型拡張が `dist/types` に含まれず利用側で効いていなかった問題を `src/index.ts` への移動で解消
- [x] **T-3** ビルドと型定義の出力を検証する → SPEC 2.2
  - [x] T-3.1 `yarn build` を通し、`dist/types` の出力内容を確認する
  - [x] T-3.2 外部プロジェクトから ESM / UMD 双方で import し、型が効くことを確認する（`node_modules/vue3-tree` を自身へのリンクにした consumer で検証。props・events・slot すべて型が効くこと、ESM / UMD の export が一致することを確認）
  - [x] T-3.3 `tree.vue` に `defineSlots` を追加し、`d.ts` の `slots` が `{}` になる問題を直す（T-3.2 で発見。R-7 が TypeScript 利用者に対して満たせていなかった）
- [x] **T-4** テストを通る状態にする → SPEC 2.1
  - [x] T-4.1 テストを通す（2026-09-20、T-2 の検証として実施。テスト 1 件パス、スナップショット更新は不要だった。`test/tree.spec.ts` の import 名のずれは T-2.1 の対応で解消済み）
  - [x] T-4.2 `rearrange` / `select` / `update-name` の振る舞いテストを追加する（`test/events.spec.ts`、7 件）
- [ ] **T-5** 公開する → SPEC 2.2
  - [x] T-5.1 `package.json` の version を 0.2.0 にする（2026-09-22、D-9）
  - [!] T-5.2 `npm publish`（`prepublishOnly` で build が走る）— ブロック理由: npm に未ログイン（`npm adduser` が必要）。パッケージ名は `vue3-dnd-tree` に決定済み（D-10）。実行は外向きの操作なので、着手前にユーザーへ確認する
  - [ ] T-5.3 `v0.2.0` タグを push する（`release.yml` が publish と GitHub Release の作成まで行う。ただし初回 publish の手段が未決 → SPEC 5）
  - [x] T-5.4 LICENSE ファイルを追加する（2026-09-22。Apache-2.0 の公式全文を取得し、著作権表記を最初のコミット年に合わせて `Copyright 2023 Yusuke SAITO` とした）
  - [x] T-5.5 公開物を整理する（2026-09-22。`.d.ts.map` の生成を止め、`tsbuildinfo` を `dist/` の外へ移動。`.js.map` は `sourcesContent` を持つので残す。CHANGELOG.md は `files` に追加。49.1kB → 47.2kB、unpacked 179.4kB → 173.2kB）
  - [x] T-5.6 CHANGELOG.md を作る（2026-09-22。0.2.0 は unreleased のまま。publish 時に日付を入れる）
  - [x] T-5.7 CI と Release のワークフローを置く（2026-09-22、D-11）。`yarn install --immutable` までローカルで確認済み。`test:run` と `typecheck:test` の script も追加

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。

<!-- 例: ## マイルストーン 0: 環境構築（2026-09-20 完了） -->

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら [SPEC.md](./SPEC.md) の未決事項か正式なタスクに昇格させる。

- `src/tree.vue` の 1 段目と `src/treenode.vue` の 2 段目以降でマークアップが重複している。共通化したいが、ルートだけ `.tree-header`、以降は `.tree-item` とクラスが異なり、単純には括り出せない。
- lint / formatter が未導入。`yarn typecheck` が事実上の代わりになっている。
- ドラッグ処理が `tree.vue` に 700 行超で集中している。composable への切り出しは D-1 の「state はひとつ」を壊さない範囲で検討する。
- イベントとスロットに渡るノードは内部コピー（`InnerTreenode`）で、利用側クラスで定義したメソッドを持たない。一方、公開型 `TreeEventHandlers<U, T>` は `T` が渡る形になっており、型と実体がずれている。README には実態を注記した。
- happy-dom は `Element.animate` を持たず、`getComputedStyle` の戻り値が iterable でなく、レイアウトも持たない。そのため `rearrange` のテストはこの 3 つのスタブ前提になっている。ドロップ位置の計算そのものは検証できているが、実ブラウザでの挙動は sandbox で目視確認するしかない。
