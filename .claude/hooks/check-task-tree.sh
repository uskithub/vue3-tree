#!/bin/sh
# src/ に未コミットの変更があるのに docs/TASK-TREE.md が未更新なら警告する。
# CLAUDE.md の運用ルール 3（タスクの状態が変わったらそのターンのうちに更新する）の取りこぼし防止。
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/docs/TASK-TREE.md" ] || exit 0

src_changed=$(git -C "$root" status --porcelain -- src)
tasktree_changed=$(git -C "$root" status --porcelain -- docs/TASK-TREE.md)

if [ -n "$src_changed" ] && [ -z "$tasktree_changed" ]; then
    printf '%s' '{"systemMessage":"src/ に未コミットの変更がありますが docs/TASK-TREE.md が更新されていません。タスクの状態を反映してください（CLAUDE.md 運用ルール 3）。"}'
fi
exit 0
