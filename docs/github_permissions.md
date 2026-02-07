## GitHub App 側の必要設定

このサービスは GitHub GraphQL API を使用して、以下の情報を読み取ります。

- リポジトリ数、スター数、言語数、最古リポジトリの作成日
- コミット数（contributionsCollection）
- Issue 数（open/closed 合計）
- Pull Request 数
- レビュー数（Pull Request Review）
- フォロワー数
- 所属 Organizations 数

### 最小権限（読み取り専用）
GitHub App を利用する場合は、以下の **Read-only** を付与してください。

#### Repository permissions
- **Metadata**（必須）
- **Issues**（Issue 数の取得に必要）
- **Pull requests**（PR 数・レビュー数の取得に必要）

#### Organization permissions
- **Organization**（所属 Organizations 数の取得に必要）

#### Account permissions
- **User**（フォロワー数の取得に必要）

> 画面上の権限名は GitHub の UI 表示に従ってください。該当する読み取り権限が見当たらない場合は、同等の読み取り権限（ユーザープロフィール / ソーシャル / Organization の参照）を付与してください。

### リポジトリのアクセス範囲
- 公開リポジトリのみでよい場合は **Public repositories**。
- 私有リポジトリも含めたい場合は **All repositories** または対象リポジトリを選択してください。

### トークン設定
GitHub App の **Installation access token** を取得し、環境変数に設定します。

- `GITHUB_TOKEN1`（必須）
- `GITHUB_TOKEN2`（任意：冗長化用）
- `GITHUB_USERNAME`（固定で取得する GitHub ユーザー名）

> Installation access token は有効期限（通常 1 時間）があるため、運用では定期更新が必要です。必要に応じてトークン発行の自動化を行ってください。
