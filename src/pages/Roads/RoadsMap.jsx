import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ROAD_CONDITIONS } from '../../services/roadConditions';
import { lineToPositions } from '../../utils/geo';

const KARAKALPAKSTAN_CENTER = [42.4602, 59.6073];
const KARAKALPAKSTAN_ZOOM = 8;

function RoadPopup({ road }) {
  const { color, label } = ROAD_CONDITIONS[road.condition];
  return (
    <div className="map-popup">
      <h4 className="map-popup__title">{road.name}</h4>
      <p className="map-popup__meta">
        Holati:{' '}
        <span className="map-popup__tag" style={{ color, borderColor: color }}>
          {label}
        </span>
      </p>
    </div>
  );
}

// Dedicated Yoʻllar map - shows only road polylines, colored by condition
// (green = asphalt, yellow = gravel, red = dirt/unpaved), drawn by the admin
// at /admin/roads and persisted to the real Road backend model (see
// src/services/api.js).
function RoadsMap({ roads = [] }) {
  return (
    <MapContainer
      center={KARAKALPAKSTAN_CENTER}
      zoom={KARAKALPAKSTAN_ZOOM}
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

      {roads.map((road) => {
        const positions = lineToPositions(road.path);
        if (positions.length === 0) return null;
        return (
          <Polyline
            key={road.id}
            positions={positions}
            pathOptions={{ color: ROAD_CONDITIONS[road.condition].color, weight: 4 }}
          >
            <Popup className="cyber-popup">
              <RoadPopup road={road} />
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}

export default RoadsMap;
