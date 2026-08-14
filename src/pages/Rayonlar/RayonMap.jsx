import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Nukus, Karakalpakstan - matches the region default ("Qoraqalpogʻiston")
// used by the Rayon model in SmartMahalla_API_Hujjat.md §4.1. The map
// always opens locked to this view; it only moves in response to an
// explicit user selection (see FitBounds and the polygon click handler
// below), never automatically on data load.
const DEFAULT_CENTER = [42.4602, 59.6073];
const DEFAULT_ZOOM = 8;

const FLY_OPTIONS = { padding: [32, 32], duration: 1.1 };

// Fits/flies to `features` whenever the data actually changes AFTER the
// initial load (e.g. a filter is applied) - but deliberately skips the
// first time features go from empty to populated, so the map's initial
// paint stays locked to the Karakalpakstan default instead of jumping to
// wherever the first data load happens to contain. (Effects fire once on
// mount with `features` still empty - that run is a no-op below - so the
// flag has to track the first *populated* run, not simply "the first
// run", or the genuine initial load ends up triggering a fly anyway.)
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

function RayonPolygons({ features, onSelectRayon }) {
  const map = useMap();

  return (
    <GeoJSON
      key={features.map((f) => f.properties.id).join('-')}
      data={{ type: 'FeatureCollection', features }}
      style={{ color: '#ff1493', weight: 2.5, fillOpacity: 0, fillColor: '#ff1493' }}
      onEachFeature={(feature, layer) => {
        layer.bindTooltip(feature.properties.name, { sticky: true });
        layer.on({
          click: () => {
            // Fly to the selected rayon first, then hand off to the
            // navigation callback once the animation has had a moment to
            // play - jumping straight to /mahallalar would cut it short.
            map.flyToBounds(layer.getBounds(), FLY_OPTIONS);
            if (onSelectRayon) {
              window.setTimeout(() => onSelectRayon(feature.properties.id), 650);
            }
          },
          mouseover: (e) => e.target.setStyle({ fillOpacity: 0.15, weight: 3.5 }),
          mouseout: (e) => e.target.setStyle({ fillOpacity: 0, weight: 2.5 }),
        });
      }}
    />
  );
}

function RayonMap({ rayons = [], onSelectRayon }) {
  const features = useMemo(
    () =>
      rayons
        .filter((r) => r.plot?.geometry)
        .map((r) => ({
          ...r.plot,
          properties: { id: r.id, name: r.name },
        })),
    [rayons]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="entity-map"
    >
      {/* Google Hybrid (satellite imagery + roads/labels). This is Google's
          unofficial `/vt/` tile endpoint (no API key, no billing) rather
          than the Maps JavaScript/Tiles API - it's not covered by Google's
          ToS for production use and can be rate-limited or blocked without
          notice. Fine for this demo; swap for the Maps Tiles API (or a
          ToS-compliant provider like Esri World Imagery) before shipping. */}
      <TileLayer
        attribution="&copy; Google Maps"
        maxZoom={20}
        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      />

      {features.length > 0 && (
        <RayonPolygons features={features} onSelectRayon={onSelectRayon} />
      )}

      <FitBounds features={features} />
    </MapContainer>
  );
}

export default RayonMap;
