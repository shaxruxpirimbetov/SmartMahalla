import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Nukus, Karakalpakstan - see RayonMap.jsx for the same convention. The map
// always opens locked to this view; it only moves in response to an
// explicit user selection (a rayon filter change, or clicking a mahalla
// polygon), never automatically on data load.
const DEFAULT_CENTER = [42.4602, 59.6073];
const DEFAULT_ZOOM = 8;

const FLY_OPTIONS = { padding: [32, 32], duration: 1.1 };

// Fits/flies to `features` whenever the data actually changes AFTER the
// initial load (e.g. the rayon filter dropdown changes) - but deliberately
// skips the first time features go from empty to populated, so the map's
// initial paint stays locked to the Karakalpakstan default instead of
// jumping to wherever the first data load happens to contain. (Effects
// fire once on mount with `features` still empty - that run is a no-op
// below - so the flag has to track the first *populated* run, not simply
// "the first run", or the genuine initial load ends up triggering a fly
// anyway - even for a `?rayon=` deep link.)
function FitBounds({ features }) {
  const map = useMap();
  const hasFlownOnce = useRef(false);

  useEffect(() => {
    if (!features.length) return;

    if (!hasFlownOnce.current) {
      hasFlownOnce.current = true;
      return;
    }

    const bounds = L.geoJSON({ type: 'FeatureCollection', features }).getBounds();
    if (bounds.isValid()) {
      map.flyToBounds(bounds, FLY_OPTIONS);
    }
  }, [features, map]);

  return null;
}

function MahallaPolygons({ features }) {
  const map = useMap();

  return (
    <GeoJSON
      key={features.map((f) => f.properties.id).join('-')}
      data={{ type: 'FeatureCollection', features }}
      style={{ color: '#10b981', weight: 2, fillOpacity: 0, fillColor: '#10b981' }}
      onEachFeature={(feature, layer) => {
        layer.bindTooltip(feature.properties.name, { sticky: true });
        layer.on({
          click: () => map.flyToBounds(layer.getBounds(), FLY_OPTIONS),
          mouseover: (e) => e.target.setStyle({ fillOpacity: 0.15, weight: 3 }),
          mouseout: (e) => e.target.setStyle({ fillOpacity: 0, weight: 2 }),
        });
      }}
    />
  );
}

function MahallaMap({ mahallas = [] }) {
  const features = useMemo(
    () =>
      mahallas
        .filter((m) => m.plot?.geometry)
        .map((m) => ({
          ...m.plot,
          properties: { id: m.id, name: m.name },
        })),
    [mahallas]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="entity-map"
    >
      {/* Google Hybrid basemap - see RayonMap.jsx for the rationale/caveat. */}
      <TileLayer
        attribution="&copy; Google Maps"
        maxZoom={20}
        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      />

      {features.length > 0 && <MahallaPolygons features={features} />}

      <FitBounds features={features} />
    </MapContainer>
  );
}

export default MahallaMap;
