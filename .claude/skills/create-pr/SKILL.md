---
name: create-pr
description: PRベースの開発ワークフロー。機能ブランチ作成→実装→PR作成の流れで開発を行う。新機能実装、バグ修正、リファクタリングなど、mainへの変更が必要な時に使用。
---

# PR Based Development Workflow

mainブランチへの直接pushを避け、PRベースで開発を行うためのワークフロー。

## 前提条件

- `gh` (GitHub CLI) インストール済み・認証済み
- mainブランチが保護されている（推奨）

## ワークフロー

### 1. 現在のブランチ確認

```bash
git branch --show-current
git status
```

mainブランチにいる場合は新しいブランチを作成する。

### 2. 機能ブランチ作成

ブランチ命名規則:
- `feature/機能名` - 新機能
- `fix/バグ名` - バグ修正
- `refactor/対象` - リファクタリング
- `docs/対象` - ドキュメント更新
- `chore/対象` - 設定変更など

```bash
git checkout main
git pull origin main
git checkout -b feature/機能名
```

### 3. 実装・コミット

通常通り実装を行い、コミットする。

```bash
git add -A
git commit -m "feat: 機能の説明"
```

コミットメッセージ規則:
- `feat:` - 新機能
- `fix:` - バグ修正
- `refactor:` - リファクタリング
- `docs:` - ドキュメント
- `chore:` - その他

### 4. プッシュ

```bash
git push -u origin HEAD
```

### 5. PR作成

```bash
gh pr create --title "PRタイトル" --body "$(cat <<'EOF'
## Summary
- 変更内容の要約

## Changes
- 具体的な変更点

## Test Plan
- [ ] テスト項目

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 6. CI確認

PRが作成されると、GitHub Actions CIが自動実行される:
- Frontend: lint, type check, build
- Backend: ruff, black, (mypy)

CIが通らない場合は修正してプッシュ:

```bash
git add -A
git commit -m "fix: CI修正"
git push
```

### 7. マージ

CIが通り、レビューが完了したらマージ:

```bash
gh pr merge --squash --delete-branch
```

オプション:
- `--squash` - コミットを1つにまとめる
- `--merge` - マージコミット作成
- `--rebase` - リベースマージ
- `--delete-branch` - マージ後ブランチ削除

## 注意事項

- mainブランチには直接pushしない
- CIが通らないPRはマージしない
- 1つのPRは1つの機能/修正に集中する
- 大きな変更は小さなPRに分割する

## トラブルシューティング

### mainブランチに直接コミットしてしまった場合

まだpushしていない場合:
```bash
git checkout -b feature/機能名
git checkout main
git reset --hard origin/main
```

### コンフリクトが発生した場合

```bash
git fetch origin
git rebase origin/main
# コンフリクト解消後
git add -A
git rebase --continue
git push --force-with-lease
```
