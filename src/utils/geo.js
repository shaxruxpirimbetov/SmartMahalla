// GeoJSON <-> Leaflet [lat, lng] conversions. GeoJSON coordinates are
// [lng, lat]; every react-leaflet component (Marker/Polygon/Polyline)
// expects [lat, lng] - these are the single place that flip does.

export function pointToLatLng(feature) {
  const coords = feature?.geometry?.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  return [lat, lng];
}

export function polygonToPositions(feature) {
  const ring = feature?.geometry?.coordinates?.[0] ?? [];
  const positions = ring.map(([lng, lat]) => [lat, lng]);

  // leaflet-draw closes polygon rings by repeating the first point at the
  // end (standard GeoJSON) - <Polygon> renders the closing edge itself, so
  // drop the duplicate instead of feeding it an extra redundant vertex.
  if (positions.length > 1) {
    const [firstLat, firstLng] = positions[0];
    const [lastLat, lastLng] = positions[positions.length - 1];
    if (firstLat === lastLat && firstLng === lastLng) positions.pop();
  }

  return positions;
}

export function lineToPositions(feature) {
  const coords = feature?.geometry?.coordinates ?? [];
  return coords.map(([lng, lat]) => [lat, lng]);
}
