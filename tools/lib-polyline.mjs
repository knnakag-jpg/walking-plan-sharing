// Minimal encoded-polyline (Google/Valhalla algorithm) encode/decode, precision configurable (Valhalla uses 6).
export function decodePolyline(str, precision = 6) {
  const factor = Math.pow(10, precision);
  let index = 0, lat = 0, lng = 0;
  const coordinates = [];
  while (index < str.length) {
    let result = 1, shift = 0, b;
    do {
      b = str.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    result = 1; shift = 0;
    do {
      b = str.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

export function encodePolyline(coords, precision = 6) {
  const factor = Math.pow(10, precision);
  function encodeNum(num) {
    num = num < 0 ? ~(num << 1) : (num << 1);
    let out = '';
    while (num >= 0x20) {
      out += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }
    out += String.fromCharCode(num + 63);
    return out;
  }
  let out = '', prevLat = 0, prevLng = 0;
  for (const [lat, lng] of coords) {
    const lat5 = Math.round(lat * factor);
    const lng5 = Math.round(lng * factor);
    out += encodeNum(lat5 - prevLat);
    out += encodeNum(lng5 - prevLng);
    prevLat = lat5; prevLng = lng5;
  }
  return out;
}
