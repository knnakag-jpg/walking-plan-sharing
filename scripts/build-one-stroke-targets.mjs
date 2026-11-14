import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const worklist = read('data/rebuild-worklist.json').records;
const examples = new Map(read('data/research/one-stroke-examples-build.json').results.map((item) => [item.courseId, item]));
const reported = new Set(read('data/research/retrace-reports.json').courseIds);
const escape = (text) => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const ranked = [...worklist].sort((a, b) => Number(reported.has(b.id)) - Number(reported.has(a.id)) || b.priorityScore - a.priorityScore || a.id.localeCompare(b.id, 'ja'));
const lines = [
  '# 全97コース・一筆書き再構築対象一覧',
  '',
  '更新: 2026-11-14。生成: `node scripts/build-one-stroke-targets.mjs`。旧経路は全件レビュー対象。下表の反復は保存済みGeoJSONの丸めた線分が重なる長さで、同一道路エッジ・歩行可能性の確定値ではありません。',
  '',
  `- 全件: ${worklist.length}。旧線の反復候補100m以上: ${worklist.filter((item) => item.legacy.repeatedGeometryM >= 100).length}。利用者指摘: ${reported.size}。計算候補を作成: ${examples.size}。`,
  '- 計算候補の「形状上0m」は地図・入口・横断・現地確認の合格を意味しません。距離不足は往復で埋めず、理由を記録します。',
  '- 旧線の反復が100m未満でも、並行歩道、施設内、橋、旧経由点の誤りがあり得るため「合格」としません。',
  '',
  '| ID | コース | 旧線の反復候補 | 区分 | 新候補 | Claudeの次の作業 |',
  '| --- | --- | ---: | --- | --- | --- |',
];
for (const item of ranked) {
  const candidate = examples.get(item.id);
  const category = reported.has(item.id) ? '利用者指摘・優先' : item.legacy.repeatedGeometryM >= 100 ? '反復100m以上' : '全件レビュー';
  const candidateCell = candidate ? `[${(candidate.distanceM / 1000).toFixed(2)}km・形状上${candidate.repeatedExactM}m](../${candidate.geometryUrl})／地図待ち` : item.existingNewVariants.length ? `A/B/C一部試作・${item.existingNewVariants.map((route) => route.status).join('/')}` : '未生成';
  const next = candidate ? '入口・園路・横断と除外地点を地図レビュー。採否記録' : item.existingNewVariants.length ? '新A/Bの道路反復と出入口を地図レビュー' : item.transportHints.length ? '徒歩以外の区間を分離し、出典付きで再設計' : '公式資料と実在の道を照合し、A/B/Cを個別に計算';
  lines.push(`| ${escape(item.id)} | ${escape(item.title)} | ${item.legacy.repeatedGeometryM}m・${item.legacy.repeatedGeometryPct}% | ${category} | ${candidateCell} | ${next} |`);
}
lines.push('', '集計の元: [`data/rebuild-worklist.json`](../data/rebuild-worklist.json)、[`data/route-audit.json`](../data/route-audit.json)、[`one-stroke-examples-build.json`](../data/research/one-stroke-examples-build.json)。', '');
fs.writeFileSync(path.join(root, 'design-review/All-Courses-One-Stroke-Targets.md'), lines.join('\n'));
console.log(`Wrote ${ranked.length} one-stroke target rows.`);
