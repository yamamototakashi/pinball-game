# NEON MICRO PINBALL

iPhone Safari で快適に遊べる、派手でクセになるネオンピンボール (PWA)。

舞台は小さな未来都市の遊技台内部。光球を打ち出してギミックを連鎖させ、街を覚醒させよう。

## 特徴

- 縦持ち最適化、画面下半分の左右タップでフリッパー操作
- ネオン発光・パーティクル・スコアポップ・フィーバー演出
- バンパー / スリングショット / ターゲット群 / レーン / モードホール
- コンボ / 倍率アップ / 短時間フィーバー
- ハイスコアを localStorage に保存
- WebAudio による軽量SE (ON/OFF可能)
- PWA対応 (オフライン起動可、ホーム画面追加対応)
- 外部依存ゼロ

## 操作

| 操作 | 入力 |
|---|---|
| 左フリッパー | 画面下の左半分タップ / ← / Z |
| 右フリッパー | 画面下の右半分タップ / → / / / M |
| ボール打ち出し | 画面タップ / Space |
| 音ON/OFF | 右上 🔊 ボタン |
| リスタート | 右上 ↻ ボタン |

## ファイル構成

```
.
├── index.html
├── style.css
├── manifest.webmanifest
├── service-worker.js
├── .nojekyll
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── js/
│   ├── main.js       # エントリ + ゲームループ + 状態管理
│   ├── input.js      # タッチ/キー入力
│   ├── physics.js    # 衝突判定
│   ├── table.js      # 盤面定義
│   ├── flippers.js   # フリッパー
│   ├── ball.js       # ボール
│   ├── effects.js    # パーティクル/ポップ/フラッシュ
│   ├── audio.js      # WebAudio SE
│   ├── hud.js        # HUD描画
│   └── storage.js    # ハイスコア
└── .github/workflows/gh-pages.yml
```

## ローカル起動

ES module を使うため、ファイル直開きではなくローカルサーバ経由で開いてください。

```bash
# Python があれば
python3 -m http.server 8080
# あるいは
npx serve .
```

ブラウザで `http://localhost:8080/` を開きます。
iPhone実機確認は同一Wi-Fi上で `http://<PCのIP>:8080/` にアクセス。

## GitHub Pages へのデプロイ

### 1. リポジトリを作成

GitHub上で新しいリポジトリを作成 (例: `pinball-game`)。

### 2. プッシュ

```bash
git init
git add .
git commit -m "Initial: NEON MICRO PINBALL"
git branch -M main
git remote add origin https://github.com/<your-name>/pinball-game.git
git push -u origin main
```

### 3. GitHub Pages を有効化

リポジトリの **Settings → Pages** で:

- **Source**: "GitHub Actions" を選択

### 4. Actions で自動デプロイ

`.github/workflows/gh-pages.yml` が同梱済み。`main` への push で自動デプロイされます。

公開URL: `https://<your-name>.github.io/pinball-game/`

### 簡易公開 (Actions を使わない場合)

Settings → Pages で **Source: Deploy from a branch / Branch: main / Folder: / (root)** を選択するだけでも公開可能です。`.nojekyll` が同梱されているのでJekyll処理は走りません。

## iPhoneでホーム画面追加

1. Safari で公開URLを開く
2. 共有メニュー → 「ホーム画面に追加」
3. ホーム画面のアイコンから起動するとフルスクリーンPWAとして動作

## よくある不具合と対処

| 症状 | 対処 |
|---|---|
| 真っ黒で動かない | `file://` 直開きはNG。ローカルサーバ経由で開く |
| iPhoneでスクロールしてしまう | `index.html` の viewport / `touch-action:none` を確認 |
| 音が出ない | ミュート解除 (右上🔊)、または初回タップでAudioContextが起動するまで待つ |
| ホーム画面追加後にオフラインで開けない | 一度オンラインで起動してService Workerをキャッシュさせる |
| GitHub Pages で 404 | パスが相対 (`./...`) になっているか確認。リポジトリ名がサブパスになる点に注意 |
| アイコンがぼやける | `icons/` 内の PNG を高解像度に差し替え |

## 改善案

### 軽微改善
- ハプティクス (`navigator.vibrate`) でヒット感を強化
- 残ボールをアイコン表示
- 設定にBGM追加

### 演出強化
- 盤面に動的テクスチャ (走査線、ノイズ)
- フィーバー時に背景がスペクトラムアニメ
- ハイスコア更新時のリッチ演出シーケンス

### 追加モード
- マルチボール
- ボスバトル風モード (中央ターゲットを連打)
- ミッション制 (3ミッション達成でエクストラボール)

---

Enjoy the neon. ✦
