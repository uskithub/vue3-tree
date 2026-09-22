# TASK TREE — vue3-dnd-tree

最終更新: 2026-09-22

作業の現在地。タスクの状態が変わったら、そのターンのうちにここを更新する。

## 記法

- ステータス: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` ブロック中 / `[-]` 取り止め
- 各タスクには ID を振る。会話では ID で指す（例: 「T-2.1 を進めて」）。
- `→ SPEC 3.2` のように、根拠となる [SPEC.md](./SPEC.md) の節番号を書く。節が無いタスクは、仕様が未定か、そもそも不要なタスク。
- `[!]` には必ず理由を書く。理由の無いブロックは放置される。

## 現在のフォーカス

**T-8** — 待ち。次に中身のある変更をリリースするときに検証する

## マイルストーン 2: リリース運用を仕上げる

0.2.0 は手作業が残った状態で出た。次のリリースを `git tag` だけで完結させる。

- [x] **T-6** npm に Trusted Publisher を登録する → SPEC D-11（2026-09-22、ユーザーが実施）
  - 設定状態は registry のメタデータに出ないため、実際に publish するまで検証できない（→ T-8）。
- [x] **T-7** `v0.2.0` の Release Notes を CHANGELOG の内容に差し替える（2026-09-22、ユーザーが実施）
  - 破壊的変更 2 件と before/after のコード例が載っていることを確認済み。
- [ ] **T-8** 次のリリースで `release.yml` が通ることを確認する
  - 検証したいのは 3 点: Trusted Publishing による OIDC publish、`CHANGELOG.md` からの Release Notes 生成、`--provenance` の署名。
  - 0.2.0 は手動 publish だったため provenance が付いていない。Actions から出す最初のリリースで付く。
  - 検証のためだけに 0.2.1 を出すことは見送った（2026-09-22）。次に中身のある変更を出すときに一緒に確認する。
  - リリース手順: CHANGELOG.md に節を足す → `package.json` の version を上げる → コミット → `git tag -a vX.Y.Z -m vX.Y.Z` → `git push origin master --follow-tags`。以降は `release.yml` が publish と GitHub Release を行う。

## 完了済み

完了したマイルストーンは丸ごとここへ移す。個別タスクの完了は移さず、上のツリーで `[x]` にしておく。

### マイルストーン 1: v0.2.0 を npm に公開する（2026-09-22 完了）

- [x] **T-1** README を現行 API に追従させる → SPEC 3.3
  - [x] T-1.1 使用例を `BaseTreenode<T>` の派生クラスに書き換える（旧 README は廃止済みの `Treenode` 型リテラルのままだった）
  - [x] T-1.2 props に `version` を追加し、外部更新の反映手順を書く → SPEC 3.2
  - [x] T-1.3 events を `rearrange` / `toggle-folding` / `toggle-editing` / `update-name` / `select` に差し替える（旧 README の `arrange` / `hover` / `dragenter` は実在しなかった）
  - [x] T-1.4 slot props を `node` / `parent` / `depth` / `isHovering` / `isEditing` / `endEditing` に更新する
  - [x] T-1.5 プラグイン登録（`createVue3Tree` / `app.use`）とスタイル・mdi の読み込み手順を追記する
- [x] **T-2** 公開する API を確定させる → SPEC 3.3
  - [x] T-2.1 後方互換 export（`tree`）を削除する（D-6）
  - [x] T-2.2 デバッグ用 `console.log` を除去する（`src/tree.vue`、`src/treenode.ts`）
  - [x] T-2.3 "modification has not reflected." 表示を開発用と判断して削除する（D-7）
  - [x] T-2.4 グローバル登録名を `Vue3Tree` / `Vue3Treenode` に統一する（D-8）。併せて、型拡張が `dist/types` に含まれず利用側で効いていなかった問題を `src/index.ts` への移動で解消
- [x] **T-3** ビルドと型定義の出力を検証する → SPEC 2.2
  - [x] T-3.1 `yarn build` を通し、`dist/types` の出力内容を確認する
  - [x] T-3.2 外部プロジェクトから ESM / UMD 双方で import し、型が効くことを確認する（`node_modules` に自身へのリンクを張った consumer で検証）
  - [x] T-3.3 `tree.vue` に `defineSlots` を追加し、`d.ts` の `slots` が `{}` になる問題を直す（T-3.2 で発見。R-7 が TypeScript 利用者に対して満たせていなかった）
- [x] **T-4** テストを通る状態にする → SPEC 2.1
  - [x] T-4.1 テストを通す（スナップショット更新は不要だった）
  - [x] T-4.2 `rearrange` / `select` / `update-name` の振る舞いテストを追加する（`test/events.spec.ts`、7 件）
- [x] **T-5** 公開する → SPEC 2.2
  - [x] T-5.1 version を 0.2.0 にする（D-9）
  - [x] T-5.2 npm に publish する（`vue3-dnd-tree@0.2.0`）。npm の `vue3-tree` が別プロジェクトのものだったため改名した（D-10）
  - [x] T-5.3 `v0.2.0` タグを push する（`release.yml` が動き、publish はスキップされ GitHub Release が作られた）
  - [x] T-5.4 LICENSE ファイルを追加する（Apache-2.0 の公式全文、`Copyright 2023 Yusuke SAITO`）
  - [x] T-5.5 公開物を整理する（`.d.ts.map` の生成を止め、`tsbuildinfo` を `dist/` の外へ。`.js.map` は `sourcesContent` を持つので残す。47.2kB / unpacked 173.3kB）
  - [x] T-5.6 CHANGELOG.md を作る
  - [x] T-5.7 CI と Release のワークフローを置く（D-11）。`test:run` と `typecheck:test` の script も追加

## 気づいたこと

作業中に見つかった、今やらないが忘れたくないこと。溜まったら [SPEC.md](./SPEC.md) の未決事項か正式なタスクに昇格させる。

- `src/tree.vue` の 1 段目と `src/treenode.vue` の 2 段目以降でマークアップが重複している。共通化したいが、ルートだけ `.tree-header`、以降は `.tree-item` とクラスが異なり、単純には括り出せない。
- lint / formatter が未導入。`yarn typecheck` が事実上の代わりになっている。
- ドラッグ処理が `tree.vue` に 700 行超で集中している。composable への切り出しは D-1 の「state はひとつ」を壊さない範囲で検討する。
- イベントとスロットに渡るノードは内部コピー（`InnerTreenode`）で、利用側クラスで定義したメソッドを持たない。一方、公開型 `TreeEventHandlers<U, T>` は `T` が渡る形になっており、型と実体がずれている。README には実態を注記した。
- happy-dom は `Element.animate` を持たず、`getComputedStyle` の戻り値が iterable でなく、レイアウトも持たない。そのため `rearrange` のテストはこの 3 つのスタブ前提になっている。ドロップ位置の計算そのものは検証できているが、実ブラウザでの挙動は sandbox で目視確認するしかない。
- `package.json` の scripts は `yarn` 前提（`prepublishOnly: "yarn build"` など）。この環境は corepack 経由でしか yarn を呼べず PATH に無いため、`npm publish` が走らせる `prepublishOnly` が `sh: yarn: command not found` で落ちる。ローカルから publish する場合は `corepack yarn build` を先に済ませて `--ignore-scripts` を付ける。CI は `corepack enable` 済みなので影響しない。
- npm の 2FA をセキュリティキー（WebAuthn）にしているため、`npm publish` は 6 桁コードではなくブラウザ認証を要求する。非対話のシェルから実行すると `EOTP` で即座に落ちる。T-6 が済めば人手の publish は不要になる。
