const radians = (value) => value * Math.PI / 180;

function segmentMeters(a, b) {
  const dLat = radians(b[1] - a[1]); const dLon = radians(b[0] - a[0]);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
}

export function routeDistances(coordinates) {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) cumulative.push(cumulative[i - 1] + segmentMeters(coordinates[i - 1], coordinates[i]));
  return cumulative;
}

function nearestRoutePoint(point, coordinates, cumulative, afterM) {
  const latScale = 111320; const lonScale = latScale * Math.cos(radians(point[1]));
  let best = null;
  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1]; const b = coordinates[i];
    const ax = (a[0] - point[0]) * lonScale; const ay = (a[1] - point[1]) * latScale;
    const dx = (b[0] - a[0]) * lonScale; const dy = (b[1] - a[1]) * latScale;
    const fraction = dx * dx + dy * dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
    const atM = cumulative[i - 1] + fraction * (cumulative[i] - cumulative[i - 1]);
    if (atM < afterM) continue;
    const offsetM = Math.hypot(ax + fraction * dx, ay + fraction * dy);
    if (!best || offsetM < best.offsetM) best = { atM, offsetM, point: [a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1])] };
  }
  return best;
}

export function playbackStops(waypoints, coordinates, cumulative) {
  let afterM = 0;
  return waypoints.flatMap((waypoint, index) => {
    const found = nearestRoutePoint(waypoint.point, coordinates, cumulative, afterM);
    if (!found || found.offsetM > 40) return [];
    afterM = found.atM + 5;
    return [{ ...found, label: waypoint.label || `旧資料の経由点 ${index + 1}`, description: waypoint.description || (waypoint.label ? 'この地点付近を通る計算経路です。施設の入口と通行条件は未確認です。' : '旧資料の経由点です。地点名と施設入口は再調査中です。') }];
  });
}

export function partialRoute(coordinates, cumulative, atM) {
  const line = [[coordinates[0][1], coordinates[0][0]]];
  for (let i = 1; i < coordinates.length; i++) {
    if (cumulative[i] <= atM) { line.push([coordinates[i][1], coordinates[i][0]]); continue; }
    const fraction = (atM - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
    line.push([coordinates[i - 1][1] + fraction * (coordinates[i][1] - coordinates[i - 1][1]), coordinates[i - 1][0] + fraction * (coordinates[i][0] - coordinates[i - 1][0])]);
    break;
  }
  return line;
}
