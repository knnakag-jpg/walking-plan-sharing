// No.8 / No.17 / No.23 を A/B として台帳へ（地図レビュー前の routed）。座標・距離は試作ビルドの値をそのまま使う。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const wr = (p, o) => fs.writeFileSync(path.join(root, p), JSON.stringify(o, null, 2));
const cat = rd('data/catalog.json');
const from = (courseId, slug, variant, v, cand, note, hideOffsetOver) => {
  const src = rd(cand);
  const geometryUrl = `data/routes/${slug}-${variant}.geojson`;
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify({ type: 'Feature', id: `${courseId}-${variant}`, properties: { courseId, routeVariant: variant, verificationStatus: 'routed', reviewNote: note, engine: 'valhalla-pedestrian', calculatedAt: src.properties.calculatedAt, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM ?? v.distanceM }, geometry: src.geometry }));
  const seen = new Map();
  const waypoints = v.stops.filter((s) => !(hideOffsetOver && s.offsetM > hideOffsetOver)).map((s) => { const n = (seen.get(s.id) || 0) + 1; seen.set(s.id, n); return { id: n === 1 ? s.id : `${s.id}_back`, label: n === 1 ? s.label : `${s.label}（戻り）`, coord: s.coord, source: s.source }; });
  return { variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM ?? v.distanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: Number((v.repeatedGeometryM / v.distanceM * 100).toFixed(1)), waypoints, legDistancesKm: v.legKm, geometryUrl };
};
const osm = { type: 'community', title: 'OpenStreetMap（名称付き地点）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅・施設中心の座標。入口ではない。' };
const legacyOld = (id) => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。距離合わせの往復は採用していない。' });

const out = {};
// ---- No.8
{
  const b = rd('data/research/no-8-route-build.json').variants;
  const r = rd('data/research/no-8-route-research.json');
  out['No.8'] = {
    results: [
      from('No.8', 'no-8', 'standard', b.standard, 'data/candidates/no-8-standard.geojson', '上野駅から谷中霊園を経て日暮里駅。ピンは施設中心で入口は地図レビュー待ち。'),
      from('No.8', 'no-8', 'extended', b.extended, 'data/candidates/no-8-extended.geojson', 'Aに西郷像、朝倉彫塑館、夕焼けだんだんを加えた案。入口は地図レビュー待ち。'),
    ],
    curated: {
      id: 'No.8', buildFile: 'data/research/no-8-adopted-build.json', title: '上野ミュージアムと谷中',
      summary: '上野公園の博物館・美術館の前から谷中霊園の五重塔跡を経て日暮里駅へ抜ける駅間ワンウェイ。Bは西郷像、朝倉彫塑館、夕焼けだんだんを加える。旧案の昼食と館内見学を前提にした工程は採用せず、屋外の通過だけを計算した。',
      themes: ['ミュージアム', '公園', '谷中', '歴史', '街並み'],
      routeReasons: {
        standard: '上野駅公園口から文化会館、西洋美術館、科博、東博の前を通り、谷中霊園の入口、五重塔跡、天王寺を経て日暮里駅へ。計算上3.03km。館内には入らず屋外だけを通るため5〜6kmには届かない。東博前で約63mの出入りが2回出る。',
        extended: 'Aの途中で西郷像に寄り、天王寺のあとに朝倉彫塑館と夕焼けだんだんを通って日暮里駅へ。計算上4.47km。距離は7〜8kmに届かないが、実在の立ち寄り先だけで組み、延伸は作らない。西郷像から西洋美術館へ向かう約167mが重なる。'
      },
      distanceExceptions: { standard: '3.03km。館内に入らず屋外だけを通る案のため5〜6kmに届かない。距離合わせの延伸は作らない。', extended: '4.47km。実在の立ち寄り先だけで組んだため7〜8kmに届かない。延伸は作らない。' },
      retraceExceptions: { standard: '東京国立博物館のピン付近で約63mの重なりが2回、ほかに約20〜25mが数か所（計約180m）。博物館前の園路を出入りする形で、距離合わせではない。入口座標は地図で未確認。', extended: '西郷像から西洋美術館へ向かう約167m（上野駅公園口からの園路の分岐戻りと推定）と東博前の約63mが2回など計約510m。地図で未確認。距離合わせの往復ではない。' },
      scenicSegments: [
        { name: '上野公園の博物館前の広場', theme: '建築と並木', direction: '公園口から北へ', reviewStatus: '候補・各館の入口を地図で照合待ち', evidenceTitle: 'OpenStreetMap' },
        { name: '谷中霊園と五重塔跡', theme: '桜並木の園路と寺町', direction: '上野から北西へ', reviewStatus: '候補・霊園入口と通行条件を地図で照合待ち', evidenceTitle: 'OpenStreetMap' }
      ],
      rainy: {
        verificationStatus: 'researched',
        summary: '雨の日は東京国立博物館または国立科学博物館の館内見学を中心にし、屋外は上野駅と館の間だけにする案。館内の連続歩行距離は未計測。',
        segments: [
          { kind: 'walk_outdoor', from: '上野駅公園口', to: '館の入口', distanceM: null, note: '屋根のない区間あり。傘が必要。' },
          { kind: 'walk_indoor', from: '館の入口', to: '展示室内', distanceM: null, note: '開館日・入館料・特別展を当日公式で確認。' },
          { kind: 'rail', from: '上野駅', to: '日暮里駅', distanceM: null, note: 'JR山手線で戻る場合。運賃・所要は当日確認。' }
        ],
        conditions: ['各館の開館日・臨時休館・料金は当日公式で確認。', '東京文化会館は休館中の可能性があり、案内に載せる場合は公式で確認。']
      },
      evidence: [...(r.evidence || []).slice(0, 4), osm],
      openQuestions: r.openQuestions
    },
    research: { decision: '2026-11-15 方針「必要な往復は許容」を受けて採用: A=上野駅→日暮里駅(3.03km・反復180m)、B=西郷像・朝倉彫塑館を加える(4.47km・反復513m)。距離は例外として記録し延伸は作らない。入口座標は未確認のため routed のまま。' }
  };
}
// ---- No.17
{
  const a = rd('data/research/no-17-route-build.json').variants.through;
  const bB = rd('data/research/no-17-extra-b-build.json');
  out['No.17'] = {
    results: [
      from('No.17', 'no-17', 'standard', a, 'data/candidates/no-17-through.geojson', '神谷町駅から東京タワー、増上寺、御成門、芝公園を経て芝公園駅。ピンは交差点・施設中心。'),
      from('No.17', 'no-17', 'extended', bB, 'data/candidates/no-17-extra-b.geojson', '神谷町駅から東京タワー、増上寺、芝公園、愛宕神社を経て虎ノ門ヒルズ駅。ピンは交差点・施設中心。')
    ],
    curated: {
      id: 'No.17', buildFile: 'data/research/no-17-adopted-build.json', title: '東京タワーと芝公園・愛宕',
      summary: '神谷町駅から東京タワーの足元、増上寺、芝公園の緑を歩く短い駅間ワンウェイ。Bは愛宕神社まで上がって虎ノ門ヒルズ駅へ抜ける。旧案の「エリア方面へ延伸（往復約3.6km）」は座標を作る必要があるため採用しない。',
      themes: ['タワー', '寺社', '公園', '展望', '街並み'],
      routeReasons: {
        standard: '神谷町駅から東京タワー前、増上寺前、御成門、芝公園を通り芝公園駅へ。計算上2.56km。麻布台ヒルズ内の入口の座標が取れないため、麻布台ヒルズの立ち寄りは含めていない。5〜6kmには大きく届かない。',
        extended: '神谷町駅から東京タワー前、増上寺前、芝公園の園内を通り、愛宕神社へ上って虎ノ門ヒルズ駅へ抜ける。計算上3.27km。愛宕神社の階段（出世の石段）を通るかは未確認。7〜8kmには届かないが延伸は作らない。'
      },
      distanceExceptions: { standard: '2.56km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。旧案の往復延伸（座標を作る必要がある）は採用しない。', extended: '3.27km。実在の立ち寄り先だけで組んだため7〜8kmに届かない。延伸は作らない。' },
      retraceExceptions: { standard: '増上寺前から御成門へ向かう約297mと、芝公園内から駅への約82mが重なる（計約380m）。御成門交差点のピン位置が原因と推定されるが、地図では未確認で、必要な往復と確認できていない。', extended: '芝公園内で約58mと約60mの短い重なり（計約126m）。園内の歩道の分岐戻りと推定。地図で未確認。' },
      scenicSegments: [
        { name: '東京タワーの足元から増上寺', theme: 'タワーと寺院の対比', direction: '神谷町から南へ', reviewStatus: '候補・歩道と入口を地図で照合待ち', evidenceTitle: 'OpenStreetMap' },
        { name: '愛宕神社の石段', theme: '都心の高台と階段', direction: '芝公園から北へ', reviewStatus: '候補・石段を通る経路か地図で照合待ち', evidenceTitle: 'OpenStreetMap' }
      ],
      rainy: {
        verificationStatus: 'researched',
        summary: '雨の日は麻布台ヒルズ内のデジタルアートミュージアム（館内）と東京タワーの展望を中心にする案。館内の連続歩行距離と屋根の連続性は未確認。',
        segments: [
          { kind: 'walk_outdoor', from: '神谷町駅', to: '麻布台ヒルズ', distanceM: null, note: '屋根の有無は未確認。傘が必要。' },
          { kind: 'walk_indoor', from: '麻布台ヒルズ', to: '館内', distanceM: null, note: '開館日・料金・予約を当日公式で確認。' },
          { kind: 'rail', from: '神谷町駅', to: '芝公園駅', distanceM: null, note: '地下鉄日比谷線・都営三田線の乗り換えで戻る場合。運賃・所要は当日確認。' }
        ],
        conditions: ['館の開館日・料金は当日公式で確認。', '屋外露出は未調査。']
      },
      evidence: [legacyOld('No.17'), osm],
      openQuestions: ['麻布台ヒルズ中央広場・デジタルアートミュージアムの入口座標（OSMに名称ノードなし）', '増上寺前から御成門の297m重なりの原因（御成門交差点ピンの位置）', '愛宕神社の石段を通る経路か、一般の歩道かの確認', '東京タワー展望台の入場条件（Aは外観のみ）']
    },
    research: { decision: '2026-11-15 方針「必要な往復は許容」を受けて採用: A=神谷町駅→芝公園駅(2.56km・反復380m)、B=神谷町駅→虎ノ門ヒルズ駅(3.27km・反復126m)。距離は例外として記録し延伸は作らない。旧案の往復延伸は採用しない。' }
  };
}
// ---- No.23
{
  const a = rd('data/research/no-23-route-build.json').variants.no_sogo;
  const bB = rd('data/research/no-23-extra-b-build.json');
  out['No.23'] = {
    results: [
      from('No.23', 'no-23', 'standard', a, 'data/candidates/no-23-no_sogo.geojson', '駅発着の周回。園内の見どころからの戻りが重なる。西なぎさのピンは経路から約218m離れているため経由点に含めない。', 70),
      from('No.23', 'no-23', 'extended', bB, 'data/candidates/no-23-extra-b.geojson', '鳥類園から葛西駅へ抜ける案。西なぎさのピンは経路から約218m離れているため経由点に含めない。', 70)
    ],
    curated: {
      id: 'No.23', buildFile: 'data/research/no-23-adopted-build.json', title: '葛西臨海公園',
      summary: '葛西臨海公園駅から大観覧車、汐風の広場、クリスタルビュー、水族園、鳥類園をめぐる駅発着の周回（A）と、鳥類園から葛西駅へ抜ける案（B）。旧案の総合レクリエーション公園への往復延伸は座標を作る必要があるため採用しない。',
      themes: ['海辺', '公園', '展望', '野鳥', '水族園'],
      routeReasons: {
        standard: '葛西臨海公園駅から大観覧車、汐風の広場、クリスタルビュー、水族園、鳥類園を通り駅へ戻る周回。計算上4.59km。園内の見どころは行き止まりの園路の先にあり、同じ道の戻りが約900m出る。西なぎさのピンは経路から約218m離れていて経路は通らない可能性があるため、経由点から外した。',
        extended: '同じ見どころを巡り、鳥類園から北へ葛西駅へ抜ける。計算上6.76km。終点が葛西駅（地下鉄東西線）に変わる。西なぎさは経由点から外しているので、鳥類園から先の経路を地図で確認する必要がある。'
      },
      distanceExceptions: { standard: '4.59km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。総合レクリエーション公園への延伸は座標を作る必要があるため採用しない。' },
      retraceExceptions: { standard: '西なぎさ方向からの戻り約323m、海浜側から駅方向へ約250m、鳥類園から駅方向へ約287m（計約905m）。園内の見どころが行き止まりの園路の先にあるため、同じ道を戻る必要がある往復と推定。地図・現地で未確認で、距離合わせの往復ではない。', extended: 'Aと同様に西なぎさ方向からの戻り約323m、海浜側から約250m、鳥類園方向約287m（計約888m）。園内の見どころが行き止まりの園路の先にあるため。未確認。' },
      scenicSegments: [
        { name: '大観覧車とクリスタルビュー', theme: '東京湾と海浜の景観', direction: '駅から海側へ', reviewStatus: '候補・園路を地図で照合待ち', evidenceTitle: 'OpenStreetMap' },
        { name: '鳥類園の汽水池', theme: '野鳥と水辺', direction: '園の北東へ', reviewStatus: '候補・観察舎への園路を地図で照合待ち', evidenceTitle: 'OpenStreetMap' }
      ],
      rainy: {
        verificationStatus: 'researched',
        summary: '雨の日は水族園の館内を中心にする案。水族園は建替え工事などで営業が変わっている可能性があり、現在の営業状況は未確認。',
        segments: [
          { kind: 'walk_outdoor', from: '葛西臨海公園駅', to: '水族園', distanceM: null, note: '屋根の有無は未確認。傘が必要。' },
          { kind: 'walk_indoor', from: '水族園', to: '館内', distanceM: null, note: '営業状況・開館日・料金を公式で確認。' },
          { kind: 'rail', from: '葛西臨海公園駅', to: '葛西駅', distanceM: null, note: '京葉線・東西線の乗り換え。運賃・所要は当日確認。' }
        ],
        conditions: ['水族園の営業状況は公式で確認が必要。', '屋外露出と強風時の閉鎖は未調査。']
      },
      evidence: [legacyOld('No.23'), osm],
      openQuestions: ['西なぎさ（橋を渡る園路）の入口と通行条件。ピンが経路から約218m離れている', '西なぎさ・鳥類園・水族園の園路網を地図で確認し、駅へ戻らずに回れるルートがあるか', '水族園の営業状況（建替え工事の有無）', 'Bの終点（葛西駅）までの歩道の連続性']
    },
    research: { decision: '2026-11-15 方針「必要な往復は許容」を受けて採用: A=葛西臨海公園駅発着(4.59km・反復905m)、B=葛西駅へ抜ける(6.76km・反復888m)。距離は例外として記録し延伸は作らない。西なぎさは経路から218m離れるため経由点から外した。' }
  };
}
for (const [id, o] of Object.entries(out)) {
  const slug = id.toLowerCase().replace('.', '-');
  wr(`data/research/${slug}-adopted-build.json`, { generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results: o.results });
  wr(`data/curated/${slug}.json`, o.curated);
  const rp = `data/research/${slug}-route-research.json`;
  const r = rd(rp);
  r.decision = o.research.decision;
  r.files = [...(r.files || []), 'scripts/adopt-extra.mjs', 'scripts/build-extra-b-variants.mjs', `data/curated/${slug}.json`, `data/research/${slug}-adopted-build.json`];
  wr(rp, r);
  const c = cat.courses.find((x) => x.id === id);
  c.routeOptions = [...['standard', 'extended'].map((v) => ({ id: `${slug}-${v}`, variant: v, geometryUrl: `data/routes/${slug}-${v}.geojson` })), c.route];
  console.log(id, o.results.map((x) => `${x.variant} ${x.distanceM}m rep ${x.repeatedGeometryM}m wp ${x.waypoints.length}`).join(' | '));
}
wr('data/catalog.json', cat);
