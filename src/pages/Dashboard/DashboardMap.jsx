import { Fragment, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polygon, Popup } from 'react-leaflet';
import { Store, Tractor } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { pointToLatLng, polygonToPositions } from '../../utils/geo';
import { createLucideMarkerIcon, polygonCenter } from '../../utils/mapIcons';

// Nukus, Karakalpakstan - matches the region default ("Qoraqalpogʻiston")
// used by the Rayon model in SmartMahalla_API_Hujjat.md §4.1. Every map in
// the app opens locked to this view; zoom 8 keeps the whole region's
// borders visible on first paint.
const KARAKALPAKSTAN_CENTER = [42.4602, 59.6073];
const KARAKALPAKSTAN_ZOOM = 8;

// Strict styling contract shared with RayonMap/MahallaMap: Rayon borders are
// pink/magenta, Mahalla borders are green, both with a transparent interior
// so the base map underneath stays visible - except the selected one (see
// `selectedArea`/`onSelectArea` below), which gets a thicker border and a
// filled interior so it's obvious which region the side panels now reflect.
function isSelected(selectedArea, type, id) {
  return selectedArea?.type === type && String(selectedArea.id) === String(id);
}

function rayonStyle(selectedArea) {
  return (feature) => {
    const selected = isSelected(selectedArea, 'rayon', feature.properties.id);
    return {
      color: '#ff1493',
      weight: selected ? 4 : 2,
      fillOpacity: selected ? 0.25 : 0,
      fillColor: '#ff1493',
    };
  };
}

function mahallaStyle(selectedArea) {
  return (feature) => {
    const selected = isSelected(selectedArea, 'mahalla', feature.properties.id);
    return {
      color: '#10b981',
      weight: selected ? 3.5 : 1.5,
      fillOpacity: selected ? 0.3 : 0,
      fillColor: '#10b981',
    };
  };
}
// Same "primary object, not background" treatment as the dedicated
// Fermerlar map (FarmersMap.jsx) - thick border, strong fill.
const FARM_STYLE = { color: '#65a30d', weight: 5, fillColor: '#84cc16', fillOpacity: 0.4 };

// Same large, high-contrast markers used on the dedicated Bizneslar/
// Fermerlar maps - see src/utils/mapIcons.jsx. Built once at module scope
// since the icon itself never changes between renders.
const businessIcon = createLucideMarkerIcon(Store, { modifier: 'business' });
const farmerIcon = createLucideMarkerIcon(Tractor, { modifier: 'farmer' });

function toFeatures(items) {
  return items
    .filter((item) => item.plot?.geometry)
    .map((item) => ({
      ...item.plot,
      properties: { id: item.id, name: item.name },
    }));
}

// Overview map for the command center - draws every Rayon and Mahalla
// boundary fetched from the live backend, plus every Admin-drawn Business
// and Farmer, using the same large lucide-react markers as their own
// dedicated maps (BusinessesMap/FarmersMap) so they're just as prominent
// here as anywhere else in the app. No placeholder markers or hardcoded
// coordinates; if there's no data yet, the map is just the empty base tiles.
// `showData` is the on/off switch driven by the "Hamma maʼlumotlar" /
// "Tozalash" toolbar in Dashboard.jsx - off hides every overlay below and
// leaves the bare base map, no need to refetch anything.
//
// `selectedArea` (`{ type: 'rayon' | 'mahalla', id, name }` or null) and
// `onSelectArea` implement the map -> dashboard-panels binding: clicking a
// Rayon or Mahalla polygon calls `onSelectArea` with that region's id/name,
// which Dashboard.jsx lifts into its own `selectedArea` state to drive every
// stat panel. The clicked-on region is also drawn with a heavier, filled
// border (see rayonStyle/mahallaStyle above) so the selection is visible on
// the map itself, not just in the side panels.
function DashboardMap({
  rayons = [],
  mahallas = [],
  businesses = [],
  farmers = [],
  showData = true,
  selectedArea = null,
  onSelectArea,
}) {
  const rayonFeatures = useMemo(
    () => (showData ? toFeatures(rayons) : []),
    [rayons, showData]
  );
  const mahallaFeatures = useMemo(
    () => (showData ? toFeatures(mahallas) : []),
    [mahallas, showData]
  );
  const businessPoints = useMemo(
    () =>
      showData
        ? businesses
            .map((b) => ({ business: b, position: pointToLatLng(b.location) }))
            .filter((b) => b.position)
        : [],
    [businesses, showData]
  );
  const farmerPlots = useMemo(
    () =>
      showData
        ? farmers
            .map((f) => ({ farm: f, positions: polygonToPositions(f.plot) }))
            .filter((f) => f.positions.length > 0)
        : [],
    [farmers, showData]
  );

  return (
    <MapContainer
      center={KARAKALPAKSTAN_CENTER}
      zoom={KARAKALPAKSTAN_ZOOM}
      scrollWheelZoom
      className="dashboard-map"
    >
      {/* Google Hybrid (satellite imagery + roads/labels) - unofficial tile
          endpoint (no API key), used the same way across every map in the
          app - see RayonMap.jsx for the fuller rationale/caveat. */}
      <TileLayer
        attribution="&copy; Google Maps"
        maxZoom={20}
        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      />

      {rayonFeatures.length > 0 && (
        <GeoJSON
          // Keyed on the selection too (not just which features are drawn)
          // so react-leaflet remounts the layer - and re-runs style/
          // onEachFeature below - the moment selectedArea changes, instead
          // of leaving a stale style/click-binding on the existing layer.
          key={`rayon-${rayonFeatures.map((f) => f.properties.id).join('-')}-${selectedArea?.type}-${selectedArea?.id}`}
          data={{ type: 'FeatureCollection', features: rayonFeatures }}
          style={rayonStyle(selectedArea)}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(feature.properties.name, { sticky: true });
            layer.on('click', () =>
              onSelectArea?.({ type: 'rayon', id: feature.properties.id, name: feature.properties.name })
            );
          }}
        />
      )}

      {mahallaFeatures.length > 0 && (
        <GeoJSON
          key={`mahalla-${mahallaFeatures.map((f) => f.properties.id).join('-')}-${selectedArea?.type}-${selectedArea?.id}`}
          data={{ type: 'FeatureCollection', features: mahallaFeatures }}
          style={mahallaStyle(selectedArea)}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(feature.properties.name, { sticky: true });
            layer.on('click', () =>
              onSelectArea?.({ type: 'mahalla', id: feature.properties.id, name: feature.properties.name })
            );
          }}
        />
      )}

      {farmerPlots.map(({ farm, positions }) => {
        const center = polygonCenter(positions);
        return (
          <Fragment key={`farm-${farm.id}`}>
            <Polygon positions={positions} pathOptions={FARM_STYLE}>
              <Popup className="cyber-popup">{farm.name}</Popup>
            </Polygon>
            {center && (
              <Marker position={center} icon={farmerIcon}>
                <Popup className="cyber-popup">{farm.name}</Popup>
              </Marker>
            )}
          </Fragment>
        );
      })}

      {businessPoints.map(({ business, position }) => (
        <Marker key={`biz-${business.id}`} position={position} icon={businessIcon}>
          <Popup className="cyber-popup">{business.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default DashboardMap;
