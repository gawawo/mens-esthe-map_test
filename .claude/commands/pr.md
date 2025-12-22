PRベースの開発ワークフローを開始します。

## 手順

1. **現在の状態を確認**してください
   - `git branch --show-current` で現在のブランチを確認
   - `git status` で変更状況を確認

2. **mainブランチにいる場合**は、新しい機能ブランチを作成してください
   - ブランチ名: `feature/機能名`, `fix/バグ名`, `refactor/対象` など
   - `git checkout -b ブランチ名`

3. **実装を行い**、適切なコミットメッセージでコミットしてください
   - `feat:` 新機能, `fix:` バグ修正, `refactor:` リファクタリング

4. **プッシュしてPRを作成**してください
   - `git push -u origin HEAD`
   - `gh pr create` でPR作成

5. **CI（GitHub Actions）が自動実行**されます
   - Frontend: lint, type check, build
   - Backend: ruff, black

6. CIが通ったら**マージ**してください
   - `gh pr merge --squash --delete-branch`

**重要**: mainブランチへの直接pushは避けてください。
