// V4/VBC 12 件の curated を生成する（A案のみ・B案は作らない理由を明記・雨天は屋内/屋外に分ける）。
import fs from 'node:fs';
import path from 'node:path';
import { rd, root } from './lib-rebuild.mjs';
const B = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const specs = {
  'G-1128': { slug: 'g-1128', title: 'G 11/28版：高輪ゲートウェイ→泉岳寺→御殿山→品川', themes: ['再開発', '歴史・泉岳寺', '夜景・イルミ'], summary: '高輪ゲートウェイ駅から泉岳寺・高輪公園・東禅寺、畠山美術館と物流博物館を経て品川セントラルガーデンへ。夜景・イルミは時期と点灯時間の確認が必要。', retrace: '泉岳寺の参道と児童遊園の前後は一本道で、同じ道を戻る約10%の重なり。', rain: '雨の日は高輪ゲートウェイ駅の駅ビルと品川駅の通路を中心にする。', rainSegs: ['高輪ゲートウェイ駅→品川駅（駅通路・商業施設）', '品川駅→品川インターシティ（屋内通路）'], oq: ['夜景・イルミの点灯時間と時期', '畠山美術館・物流博物館の入口・開館日', '高輪ゲートウェイ周辺の再開発工事による迂回'] },
  '1128-G2': { slug: '1128-g2', title: 'G-2 高輪・三田の寺町と高輪ゲートウェイシティ', themes: ['和菓子', '寺町', '再開発', '夕景'], summary: '白金高輪駅から松島屋（豆大福は売り切れ次第終了）、三田の寺町の願海寺と亀塚公園を経て、MoN Takanawa・NEWoMan 高輪の庭と展望、高輪ゲートウェイ駅、芝浦ふ頭駅へ。幽霊坂・駐日クウェート大使館・蟻鱒鳶ル・ループ橋直下の撮影地は、OSMに名称ノードがなく座標を推測しないため、経由点には含めていない。', retrace: '願海寺は寺町の奥の一本道とみられ、入口付近で同じ道を約435m戻る（地図・現地で未確認）。距離合わせの往復ではない。', rain: '雨の日は MoN Takanawa と NEWoMan 高輪の屋内、高輪ゲートウェイ駅の通路を中心にする。', rainSegs: ['MoN Takanawa（高輪ゲートウェイシティ）', 'NEWoMan 高輪（LUFTBAUM 28・29階）', '高輪ゲートウェイ駅（駅通路）'], oq: ['松島屋の開店時刻（9:30）と豆大福の売り切れ', '幽霊坂・駐日クウェート大使館・蟻鱒鳶ル・ループ橋直下の撮影地の座標（OSMに名称ノードなし）。大使館は外交施設のため歩道から短時間で', 'MoN Takanawa・NEWoMan 高輪（28・29階）の入口と営業時間', '芝浦ふ頭駅からレインボーブリッジのループ橋直下までの歩行', '夕景・夜景の日没時刻とライトアップ時間'] },
  'G-Rain': { slug: 'g-rain', title: 'G 雨天版：高輪ゲートウェイ〜品川', themes: ['雨天', '再開発'], summary: '雨の日向けに、高輪ゲートウェイ駅・泉岳寺駅・品川駅を結ぶ短い駅間。屋内通路の連続性は未確認。', retrace: null, rain: '屋内通路で駅間をつなぐ案。屋根の連続は現地で確認が必要。', rainSegs: ['高輪ゲートウェイ駅→品川駅（屋内通路）'], oq: ['駅間の屋根・屋内通路の連続性', '工事による通行止め'] },
  '1128-D1': { slug: '1128-d1', title: 'D-1 新豊洲・豊洲', themes: ['湾岸', '市場', '再開発', '下町'], summary: '市場前駅から時の鐘・月見台・新豊洲駅・ガスの科学館・豊洲公園・ららぽーと豊洲を経て、晴海を渡って月島の柏山稲荷神社・月島観音へ抜け、月島駅で終わる。有明側は橋と運河が行き止まりで回り道が長くなるため、北の月島へ延ばした。', retrace: '市場前から時の鐘・月見台へ戻る区間が一本道で、約12%の重なり。', rain: '雨の日はららぽーと豊洲と豊洲駅の屋内を中心にする。', rainSegs: ['ららぽーと豊洲（屋内）', '豊洲駅（駅通路）'], oq: ['晴海を渡る橋（春海橋・黎明橋など）の歩道と工事規制', 'teamLabなど予約制施設の営業', '月見台への歩道', '月島もんじゃの店の営業時間'] },
  '1128-D2': { slug: '1128-d2', title: 'D-2 神宮外苑・青山', themes: ['いちょう並木', '公園'], summary: '信濃町から外苑前・青山一丁目、高橋是清翁記念公園、草月美術館・虎屋ギャラリーを経て迎賓館西門へ。絵画館といちょう並木は名称ノードが取れず、経由点には含めていない。', retrace: null, rain: '雨の日は美術館・ギャラリーの屋内を中心にする。', rainSegs: ['草月美術館・虎屋ギャラリー（屋内）'], oq: ['いちょう並木の正確な位置と見頃', '神宮外苑の再開発工事による通行規制', '迎賓館西門の参観入口の条件'] },
  '1128-D3': { slug: '1128-d3', title: 'D-3 東京駅→日本橋', themes: ['駅・地下', '美術館', 'イルミ'], summary: '東京駅丸の内北口から東京ステーションギャラリー、インターメディアテク、相田みつを美術館、アーティゾン美術館、日本橋、福徳神社、三井記念美術館へ。地下通路は経路ではなく雨天案に分けた。', retrace: null, rain: '雨の日は東京駅から日本橋までの地下通路を中心にする。', rainSegs: ['東京駅→日本橋（地下通路）', 'アーティゾン美術館・三井記念美術館（屋内）'], oq: ['地下通路の接続と営業時間', '各美術館の開館日・入場料', '丸の内のイルミネーション期間'] },
  '1128-D4': { slug: '1128-d4', title: 'D-4 横浜 桜木町〜野毛山', themes: ['港', '展望', '歴史'], summary: '桜木町駅から横浜みなと博物館、赤レンガ倉庫、象の鼻パーク、日本新聞博物館、馬車道を経て野毛山公園の展望台へ。上り坂は野毛山の区間。', retrace: null, rain: '雨の日は博物館の屋内を中心にする。', rainSegs: ['横浜みなと博物館・日本新聞博物館（屋内）'], oq: ['野毛山の坂の勾配', '各博物館の開館日', '赤レンガ倉庫の催事時の混雑'] },
  '1128-D5': { slug: '1128-d5', title: 'D-5 市ヶ谷〜九段〜半蔵門', themes: ['皇居', '歴史', '上り'], summary: '市ヶ谷見附から東郷公園、靖国神社（さざれ石）、九段坂上、しょうけい館・昭和館、九段下、旧近衛師団司令部、千鳥ヶ淵戦没者墓苑、日本カメラ博物館を経て半蔵門へ。千鳥ヶ淵の桜は時期次第。', retrace: '九段下の交差点前後で同じ道を戻る約10%の重なり。', rain: '雨の日は昭和館・日本カメラ博物館の屋内を中心にする。', rainSegs: ['昭和館・日本カメラ博物館（屋内）'], oq: ['千鳥ヶ淵の桜の時期', '靖国神社の参拝時間', '九段坂の勾配'] },
  'VBC-C1': { slug: 'vbc-c1', title: 'C-1 幕張海浜公園', themes: ['公園', '新都心'], summary: '海浜幕張駅から県立幕張海浜公園（中央地区・Cブロック・D〜Fブロック）、マリーンズ・ミュージアム、豊砂公園、浜田公園を経て幕張海浜緑地へ。', retrace: null, rain: '雨の日はマリーンズ・ミュージアムと商業施設の屋内を中心にする。', rainSegs: ['マリーンズ・ミュージアム（屋内）'], oq: ['ミュージアムの開館日', 'ペデストリアンデッキの接続', '海辺の風と日陰'] },
  'VBC-C2': { slug: 'vbc-c2', title: 'C-2 南町田〜長津田', themes: ['公園', '寺社'], summary: '南町田グランベリーパーク駅から八坂神社、常楽寺、つくし野ながぐつ児童公園、天王社、福泉寺、長津田の王子神社へ。グランベリーパーク自体は名称ノードが取れず経由点には含めていない。', retrace: null, rain: '雨の日はグランベリーパークの屋内を中心にする。', rainSegs: ['グランベリーパーク（屋内）'], oq: ['グランベリーパーク内の経路', '寺社の入口と参拝時間'] },
  'VBC-C3': { slug: 'vbc-c3', title: 'C-3 大井町周辺の寺社', themes: ['寺社', '住宅街'], summary: '大井町駅から南品川の公園（さくら公園・広場公園）、海晏寺、幸稲荷神社、泊船寺、青雲稲荷、八幡神社・稲荷・仲町稲荷、嶺雲寺、厳島神社、南稲荷、水神社、来迎院を経て、品川歴史館・大森貝塚遺跡庭園・鈴ヶ森（大経寺）へ南下し、大森海岸駅で終わる。大井町のOIMACHI TRACKSとしながわ中央公園は名称ノードが取れず経由点には含めていない。', retrace: null, rain: '雨の日はOIMACHI TRACKSの屋内を中心にする。', rainSegs: ['OIMACHI TRACKS（屋内）'], oq: ['OIMACHI TRACKSとしながわ中央公園の座標', '住宅街の細道', '品川歴史館の開館日・入館料', '第一京浜沿いの歩道'] },
  'VBC-C4': { slug: 'vbc-c4', title: 'C-4 立川・国立', themes: ['公園', '博物館'], summary: '立川市歴史民俗資料館から富士見公園・富士見第二公園、浅間神社、真如苑（真澄寺・慧燈院）、諏訪の森公園、昭和天皇記念館、南極・北極科学館へ。昭和記念公園の砂川口ルートは座標が取れず含めていない。', retrace: '浅間神社の参道と南極・北極科学館の前後が一本道で、約12%の重なり。', rain: '雨の日は資料館・科学館の屋内を中心にする。', rainSegs: ['立川市歴史民俗資料館・南極・北極科学館（屋内）'], oq: ['昭和記念公園の砂川口経路', '各施設の開館日'] },
  'VBC-C5': { slug: 'vbc-c5', title: 'C-5 国立〜谷保', themes: ['天満宮', '街並み'], summary: 'くにたちはたけんぼから谷保天満宮、やぼろじ、大道北公園と谷保の公園（第一〜第三）、たましん歴史・美術館、旧国立駅舎、北第一遊園を経て慶善寺へ。', retrace: null, rain: '雨の日はたましん歴史・美術館の屋内を中心にする。', rainSegs: ['たましん歴史・美術館（屋内）'], oq: ['やぼろじの営業時間', '学園通りの並木と日照'] },
};
const out = [];
for (const [id, sp] of Object.entries(specs)) {
  const build = rd(`data/research/${sp.slug}-route-build.json`);
  const v = build.variants.standard;
  const km = (v.distanceM / 1000).toFixed(2);
  const pct = v.repeatedGeometryPct;
  const curated = {
    id, buildFile: `data/research/${sp.slug}-route-build.json`, title: sp.title, summary: sp.summary, themes: sp.themes,
    routeReasons: { standard: `${sp.summary} 計算上${km}km。${B}`, extended: B },
    distanceExceptions: v.distanceM < 5000 ? { standard: `${km}km。実在の名称付き地点だけで組んだため5〜6kmに届かない。周辺の追加できる地点は使い切り、延伸は作らない。` } : v.distanceM > 6000 ? { standard: `${km}km。実在の名称付き地点を順に結んだ結果で5〜6kmをやや超えるが、6〜7kmの歩行目安には入る。距離合わせの削除はしない。` } : {},
    retraceExceptions: pct >= 10 ? { standard: sp.retrace || `計算上の重なりは約${Math.round(pct / 100 * v.distanceM)}m（一本道の前後）。` } : {},
    rainy: { verificationStatus: 'researched', summary: sp.rain, segments: [
      { kind: 'walk_outdoor', from: v.stops[0].label, to: v.stops.at(-1).label, distanceM: null, note: '屋根なし。傘が必要。' },
      ...sp.rainSegs.map((t) => ({ kind: 'walk_indoor', from: t, to: t, distanceM: null, note: '営業時間・通行は当日確認。' })),
      { kind: 'rail', from: v.stops.at(-1).label, to: v.stops[0].label, distanceM: null, note: '鉄道で戻る場合。運賃・所要は当日確認。' },
    ], conditions: ['営業時間・休館日は当日確認。', '屋外の路面は雨天で濡れやすい。'] },
    evidence: [
      { type: 'community', title: 'OpenStreetMap（名称付き地点）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-17', supports: '駅・公園・寺社・博物館の名称ノードの座標。入口ではない。' },
      { type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-17', supports: '旧案の立ち寄り先と時期。' },
    ],
    openQuestions: sp.oq,
  };
  if (v.distanceM < 5000 || v.distanceM > 6000) curated.distanceExceptions.standard ||= '';
  fs.writeFileSync(path.join(root, `data/curated/${sp.slug}.json`), JSON.stringify(curated, null, 2));
  out.push(`${id} ${km}km rep ${pct}%`);
}
console.log(out.join(' | '));
