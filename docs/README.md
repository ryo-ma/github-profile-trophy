# README
## Project Title / プロジェクトのタイトル

GitHub Profile Trophy (Deno)  
GitHub GraphQL API からユーザー統計を取得し、トロフィーのランクを算出して SVG カードを生成する Deno 製の HTTP サービスです。テーマ・タイトル/ランクのフィルタ・カードの行/列指定・背景/枠の有無をクエリで切り替えられ、ユーザー名は .env の `GITHUB_USERNAME` に固定します。

## Getting Started / スタートガイド
ローカルで開発用サーバーを起動し、SVG を確認するまでの最短手順です。  
起動後、ブラウザで http://localhost:8080/ にアクセスすると SVG が返ります。ユーザー名は `GITHUB_USERNAME` に固定され、オプションとして `theme`、`title`、`rank`、`column`、`row`、`margin-w`、`margin-h`、`no-bg`、`no-frame` などのクエリを利用できます。

## Prerequisites / 必要条件
- Deno (タスク実行とサーバー起動に使用)
- GitHub GraphQL API のアクセストークン（`GITHUB_TOKEN1`/`GITHUB_TOKEN2`）
- 固定対象ユーザー名（`GITHUB_USERNAME`）

## Installing / インストール
1. リポジトリを取得します。
2. env-example を .env としてコピーし、以下を設定します。
	- `GITHUB_TOKEN1`（必要に応じて `GITHUB_TOKEN2`）
	- `GITHUB_USERNAME`（固定で取得する GitHub ユーザー名）
	- 8080 以外で動かす場合は `PORT`
3. 依存関係は Deno が自動取得するため、次のコマンドで起動します。
	- `deno task start`

## Running the tests / テストの実行
以下でテストを実行します（`ENV_TYPE=test` が付与されます）。  
`deno task test`

## GitHub Actions / GitHub Actions
GitHub Actions で月に 1 回、固定ユーザーの情報を取得してトロフィー画像を生成します。  
スケジュールは `0 0 1 * *`（毎月 1 日 00:00 UTC）です。


## Built With / 協働するシステムのリスト
- Deno std/http - HTTP サーバー
- Soxa - GitHub GraphQL API への HTTP クライアント
