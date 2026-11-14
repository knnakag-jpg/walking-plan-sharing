# Walking Atlas

散歩先を発見・比較し、当日も参照できる静的サイトです。先行ページはルートの `index.html` のまま保持し、PC とスマートフォン向けの姉妹ページを `atlas/index.html` に置いています。GitHub Pages の公開先は `/walking-plan-sharing/atlas/` です。

これまでの判断、公開履歴、未確認事項と再開手順は [作業ジャーナル](design-review/Walking-Atlas-Work-Journal.md) に記録しています。

## 現在の到達点

| 対象 | 状態 |
| --- | --- |
| 新 UI | Discover、地図検索、最大 3 件の比較、当日画面、ライト／ダーク、保存、キーボード操作を実装。「線と地点を再生」は約9〜20秒の線描画と地点ごとの吹き出しに変更。画面表示の実機確認は未実施 |
| 旧 97 コース | ID・旧アンカー・原ページを保持して構造化。旧経路 GeoJSON を個別ファイルで収録。景観・安全・現地の再検証は未完了 |
| 清澄白河 No.47 | A 5.91 km、B 7.75 km を徒歩ルーターで計算し収録。C は屋外徒歩・館内・鉄道を分けた調査案。A/B の地図レビュー、出入口確認、現地確認は未完了 |
| 立川 No.12 | A 3.94 km、B 7.59 km を徒歩ルーターで計算し収録。Aは距離合わせの往復を除いた理由付き例外。Cは施設の調査案。公園内の園路・入園口・施設開館を要レビュー |
| 神楽坂 No.32 | A 4.26 km、B 7.46 km を徒歩ルーターで計算し収録。Aは自然な駅間の流れを優先した理由付き例外。Bは御茶ノ水・元町公園・小石川後楽園南側の道を加える。庭園内は経路に含まない。Cは屋内施設の調査案。地図・現地レビューは未完了 |
| その他の A/B/C | 94件は再構築待ち。旧経路を A/B/C と読み替えない |
| 反復を指摘された旧経路 | No.5・7・8・11・17・23の6件を再設計対象として表示。反復区間の位置を記録。No.17・11・23は計算候補を作成し、形状上の反復0mを確認。道路・入口・現地の確認は未完了 |

数値は経路形状から算出した計算値です。GPS 実測値ではありません。旧ルートは徒歩道路上の計算形状ですが、そのまま現地で安全に歩けると確認したものではありません。

## ローカル確認

```powershell
node scripts/preview.mjs 8765
```

`http://127.0.0.1:8765/atlas/` を開きます。`file://` ではデータ読込が制限されるためローカルサーバーを使います。

```powershell
node scripts/build-atlas-data.mjs
node scripts/package-atlas.mjs
node scripts/build-rebuild-worklist.mjs
node scripts/build-retrace-clusters.mjs
node scripts/build-one-stroke-targets.mjs
node scripts/verify-atlas.mjs
node --check atlas/assets/app.js
node --check atlas/assets/route-playback.mjs
node scripts/check-route-playback.mjs
node scripts/verify-one-stroke-examples.mjs
```

`verify-atlas` は 97 件の保持、再構築台帳と表示用データの一致、旧アンカー、GeoJSON の形式と距離、再構築したA/Bの距離帯または例外理由、雨天案の区間分離を検査します。道路エッジ同定、歩道・入口・通行止め、景観品質、モバイル実機操作は検査しません。

## データの場所

- `data/catalog.json`: コースと経路の表示用正本。`scripts/build-atlas-data.mjs` から生成。`scripts/package-atlas.mjs` が公開用の `atlas/data/` にコピー。
- `data/routes/*.geojson`: 97 件の旧経路と No.47・No.12・No.32 の A/B 計算経路。
- `data/route-audit.json`: 全旧経路の自動監査。形状上の重複などはレビューの手掛かりで、道路エッジの重複判定ではありません。
- `data/curated/`: 再構築中のコースの説明、景観候補、出典、未確認事項、C 案。
- `data/research/`: 地点照合と経路計算記録。検索の誤一致と棄却理由も保存。
- `data/research/retrace-reports.json` と `retrace-clusters.json`: 反復を指摘された6コースの台帳と、保存済み形状から抽出した位置付き候補。代替道路や通行条件の確認結果ではありません。
- `data/research/one-stroke-examples-plan.json`、`one-stroke-examples-build.json`、`data/candidates/`: No.17・No.11・No.23の一筆書き計算候補。旧経路は保持し、候補は公開カタログへ未採用。地図・出入口・現地レビュー待ち。
- `design-review/Claude-One-Stroke-Rebuild-and-Motion-Instructions.md`: 全件再構築と再生・地図展開演出の実装指示。`design-review/All-Courses-One-Stroke-Targets.md` は全97件の対象一覧。
- `data/reviews/`: 保存済み計算線の位置付き点検メモ。No.47のA/Bは反復形状を抽出した段階で、地図・道路・入口・現地のレビューは未完了。経路が変わるとハッシュ検査でビルドを止める。
- `data/rebuild-worklist.json`: 旧97件の再構築台帳。`node scripts/build-rebuild-worklist.mjs` で生成。
- `index.html`: 新ページ導入前の原ページで、公開中の先行ページ。
- `tools/`: 元の 97 件の経由点・経路計算・標高ツール。移行元として保持。

旧 No.47 の A/B ラベルは旧 `Routing-Logic.md` の地図優先／下り回避を指し、新サイトの A 標準／B 延長／C 雨天とは別です。新データでは `variant` と `strategy` を別項目にしています。

## 旧経路監査の結果

97 件中 73 件に一つ以上の自動レビュー項目があります。52 件は丸めた経路形状で同一区間の反復が 10% を超え、55 件は経由点の再訪、28 件は経由点が計算形状から 40 m を超えて離れます。これらは重複する集計です。個別結果は `data/route-audit.json` にあります。

次の作業は、No.17・11・23の計算候補について道路・入口・横断を地図で照合し、No.5・7・8の地点・代替道路を調べて新経路を計算することです。No.47・No.12・No.32の地図レビュー、残り94件の資料調査と A/B/C 試作も続きます。全97件の対象と個別の次作業は `design-review/All-Courses-One-Stroke-Targets.md` に記録しています。No.32の小石川後楽園園内を通る初期案は、計算線がほぼ園外だったため棄却しました。現地確認は実際に歩いた記録が得られるまで `field_verified` にしません。

## 制約

背景地図と Leaflet は外部配信です。読込に失敗しても候補、距離、説明、出典は読めます。写真は利用権限が確認できていないため掲載していません。位置情報は明示的な操作と端末の許可がある場合のみ取得し、保存しません。お気に入り、比較、手動進行はこのブラウザーのローカルストレージに保存します。
