# README

このリポジトリは @ryo-ma/github-profile-trophy のフォークプロジェクトです。権利は @ryo-ma に帰属し、ライセンスも @ryo-ma/github-profile-trophy に準拠します。

サーバー費用が嵩んでサービスが止まってしまったとのことなので、サーバー費用をかけずに動かす方向に変更しています。

 - usernameを受け取らず自分のプロフィールだけを出力する
 - バックエンドサーバーを立てず、GitHubActionsで定期的に更新する
	- その分即時性は下がっています

本当はDenoのスクリプトごと修正できたらよかったのだけど、Denoの知識が無く全然わからなかったので、GitHubActionsでサーバーを立ててGETで無理やり画像を保存しています。これはたぶんもっとさえたやり方がある。私はわかりませんでした

## 必要な設定

### リポジトリ情報とかを取得するための設定

DeveloperSettingsからPersonal access tokenを生成し.envに貼る

