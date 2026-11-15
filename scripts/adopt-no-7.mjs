// No.7 を台帳へ：A=品川駅周辺の歩行、B=芝浦ふ頭経由で台場へ。再設計が済んだので retrace-reports から外す。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const wr = (p, o) => fs.writeFileSync(path.join(root, p), JSON.stringify(o, null, 2));
const build = rd('data/research/no-7-route-build.json');
const results = ['standard', 'extended'].map((variant) => {
  const v = build.variants[variant];
  const src = rd(`data/candidates/no-7-${variant}.geojson`);
  const geometryUrl = `data/routes/no-7-${variant}.geojson`;
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify({ type: 'Feature', id: `No.7-${variant}`, properties: { courseId: 'No.7', routeVariant: variant, verificationStatus: 'routed', reviewNote: 'Stations and crossings use OSM nodes; facility entrances need map review', engine: 'valhalla-pedestrian', calculatedAt: build.calculatedAt, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM }, geometry: src.geometry }));
  return { variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: Number((v.repeatedGeometryM / v.distanceM * 100).toFixed(1)), waypoints: v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source })), legDistancesKm: v.legKm, geometryUrl };
});
wr('data/research/no-7-adopted-build.json', { generatedAt: build.calculatedAt, method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results });
wr('data/curated/no-7.json', {
  id: 'No.7', buildFile: 'data/research/no-7-adopted-build.json', title: '高輪ゲートウェイと品川・北品川',
  summary: '高輪ゲートウェイ駅から高輪大木戸跡と泉岳寺を通り、駅の南北を通り抜けて品川神社・青物横丁駅へ抜ける駅間ワンウェイ（A）。Bは芝浦ふ頭からレインボーブリッジを渡って台場まで伸ばす。旧案の品川駅構内の行き来は計算結果に残る短い重なりのみとし、距離合わせの往復は加えない。',
  themes: ['旧東海道', '宿場町', '高輪', '海辺', '橋'],
  routeReasons: {
    standard: '高輪ゲートウェイ駅から高輪大木戸跡、泉岳寺、泉岳寺駅前を通り、品川駅の高輪口から港南口へ駅を抜け、八ツ山橋、北品川、品川神社を経て青物横丁駅へ。計算上4.62km。品川駅の南北の通り抜けで約76m重なる。',
    extended: 'Aの高輪ゲートウェイから品川駅へ下り、芝浦ふ頭駅からレインボーブリッジの都道を経て台場、お台場海浜公園駅前へ。計算上9.11km。台場の入口と橋の歩道の通行を地図で確認する必要がある。距離は7〜8kmを超える。'
  },
  distanceExceptions: { standard: '4.62km。実在の駅と通りだけを結んだため5〜6kmに届かない。距離合わせの延伸は作らない。', extended: '9.11km。7〜8kmの目標を超えるが、芝浦ふ頭から台場までを実在の橋の歩道でつないだ結果で、短縮のための中途半端な切り詰めはしない。' },
  retraceExceptions: { standard: '品川駅の高輪口から港南口へ抜ける通路で約76m、北品川の駅前付近で約56m、高輪大木戸跡で約39m（計約124m）。駅の反対側へ出るための通路と交差点の横断で生じる短い往復で、距離合わせではない。', extended: '品川駅の南北の通り抜けで約56m、芝浦ふ頭駅前で約27m（計約83m）。駅の反対側へ出るための短い往復。' },
  scenicSegments: [
    { name: '高輪大木戸跡と旧東海道', theme: '江戸の入口と板の石垣', direction: '高輪ゲートウェイから泉岳寺へ', reviewStatus: '候補・歩道と大木戸の位置を地図で照合待ち', evidenceTitle: 'OpenStreetMap' },
    { name: 'レインボーブリッジと台場', theme: '橋と海辺の景観', direction: '芝浦ふ頭から台場へ', reviewStatus: '未確証・橋の歩道が徒歩で通れるか地図で照合待ち', evidenceTitle: 'OpenStreetMap' },
    { name: '北品川の旧東海道', theme: '宿場町の町並み', direction: '品川から北品川へ南へ', reviewStatus: '候補・商店街の歩行部分を地図で照合待ち', evidenceTitle: 'OpenStreetMap' }
  ],
  rainy: {
    verificationStatus: 'researched',
    summary: '雨の日は泉岳寺と品川プリンスホテル周辺の館内・屋根のある通路を中心にする案。連続した屋内徒歩コースとしては未検証。',
    segments: [
      { kind: 'walk_outdoor', from: '泉岳寺駅', to: '泉岳寺', distanceM: null, note: '屋根のない区間あり。傘が必要。' },
      { kind: 'walk_outdoor', from: '泉岳寺', to: '品川駅高輪口', distanceM: null, note: '坂道。雨天の滑りやすさは未確認。' },
      { kind: 'walk_indoor', from: '品川駅高輪口', to: '品川プリンスホテル', distanceM: null, note: '館内の連続歩行と公開範囲は未確認。' }
    ],
    conditions: ['泉岳寺の拝観時間・拝観料を当日確認。', '品川プリンスホテル館内の通り抜け可否は未確認。']
  },
  evidence: [
    { type: 'community', title: '旧資料 No.7（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。距離合わせの往復は採用していない。' },
    { type: 'community', title: 'OpenStreetMap（駅・高輪大木戸跡・泉岳寺・八ツ山橋・品川神社）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅と史跡の名称ノードの座標。入口ではない。' }
  ],
  openQuestions: ['レインボーブリッジの歩道が徒歩で通れるか（自転車専用の時間帯・通路の区分）', '台場・お台場海浜公園駅の入口', '泉岳寺の拝観時間・拝観料', '品川駅の高輪口と港南口の南北通路が歩行者に開放されているか', '品川プリンスホテル館内の通り抜け可否']
});
// 研究ファイル：旧 retrace-review を再設計済みに
const researchPath = 'data/research/no-7-route-research.json';
if (fs.existsSync(path.join(root, researchPath))) {
  const r = rd(researchPath);
  r.decision = '2026-11-15 利用者の指摘（線の反復）を受けてA/Bを実在の駅・史跡で新規計算。A=高輪ゲートウェイ→青物横丁駅(4.62km・反復124m)、B=高輪ゲートウェイ→お台場海浜公園駅前(9.11km・反復83m)。旧案の反復は残る短い通路の往復のみに減った。';
  r.stage = 'source_research_in_progress';
  r.files = ['scripts/osm-poi-area.mjs', 'scripts/build-no-7-candidates.mjs', 'data/curated/no-7.json', 'data/research/no-7-adopted-build.json'];
  wr(researchPath, r);
} else {
  wr(researchPath, { id: 'No.7', title: '高輪ゲートウェイと品川・北品川', stage: 'source_research_in_progress', checkedAt: '2026-11-15', legacyDiagnosis: { repeatedGeometryM: 234, repeatedGeometryPct: 4.2, clusters: '旧線の特異な反復区間は未特定。', decision: '再設計でA/Bを新規に計算した。' }, evidence: [], trials: [{ n: 1, variant: 'A/B 新規', result: 'A 4.62km・反復124m／B 9.11km・反復83m', finding: '高輪ゲートウェイ駅の位置は要確認。' }], decision: '2026-11-15 利用者の指摘（線の反復）を受けてA/Bを実在の駅・史跡で新規計算。', openQuestions: ['高輪ゲートウェイ駅の出入口と位置', 'レインボーブリッジの歩道の通行条件', '台場の入口'], files: ['scripts/osm-poi-area.mjs', 'scripts/build-no-7-candidates.mjs', 'data/curated/no-7.json', 'data/research/no-7-adopted-build.json'] });
}
// retrace-reports から No.7 を外す（再設計済み）
const rr = rd('data/research/retrace-reports.json');
rr.courseIds = rr.courseIds.filter((id) => id !== 'No.7');
wr('data/research/retrace-reports.json', rr);
// catalog の routeOptions 下準備（elevation用）
const cat = rd('data/catalog.json');
const c7 = cat.courses.find((c) => c.id === 'No.7');
c7.routeOptions = [...['standard', 'extended'].map((v) => ({ id: `no-7-${v}`, variant: v, geometryUrl: `data/routes/no-7-${v}.geojson` })), c7.route];
wr('data/catalog.json', cat);
console.log(results.map((r) => `${r.variant} ${r.distanceM}m rep ${r.repeatedGeometryM}m`).join(' | '));
