import { Fragment } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { Tractor } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { polygonToPositions } from '../../utils/geo';
import { createLucideMarkerIcon, polygonCenter } from '../../utils/mapIcons';
import { resolveMediaUrl } from '../../services/api';

const KARAKALPAKSTAN_CENTER = [42.4602, 59.6073];
const KARAKALPAKSTAN_ZOOM = 8;

// Thicker border + stronger fill than a typical reference-layer outline
// (see RAYON_STYLE/MAHALLA_STYLE elsewhere) - a Farmer plot is a primary
// object on this map, not background context, so it needs to read as
// clearly as the Tractor marker planted in its center below.
const FARM_STYLE = { color: '#65a30d', weight: 5, fillColor: '#84cc16', fillOpacity: 0.4 };

// Large, high-contrast marker (solid green circle, white border) - see
// src/utils/mapIcons.jsx.
const farmerIcon = createLucideMarkerIcon(Tractor, { modifier: 'farmer' });

function FarmPopup({ farm }) {
  // Farmer.photo (apps/land/models.py) comes back as a path relative to the
  // backend's MEDIA_URL, not a usable <img src> on its own - see
  // resolveMediaUrl in api.js.
  const photoUrl = resolveMediaUrl(farm.photo);
  return (
    <div className="map-popup">
      {photoUrl && <img src={photoUrl} alt={farm.name} className="map-popup__image" />}
      <h4 className="map-popup__title">{farm.name}</h4>
      <p className="map-popup__desc">
        <strong>{farm.crop}.</strong> {farm.description}
      </p>
    </div>
  );
}

// Dedicated Fermerlar map - shows only farm boundary polygons, drawn by the
// admin at /admin/farmers and persisted to the real Farmer backend model
// (see src/services/api.js).
function FarmersMap({ farmers = [] }) {
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

      {farmers.map((farm) => {
        const positions = polygonToPositions(farm.plot);
        if (positions.length === 0) return null;
        const center = polygonCenter(positions);
        return (
          // Fragment, not a <div> - react-leaflet's Polygon/Marker attach
          // themselves straight to Leaflet's map panes rather than
          // rendering real DOM nodes here, so a host element in between
          // would just sit as stray markup inside the map container.
          <Fragment key={farm.id}>
            <Polygon positions={positions} pathOptions={FARM_STYLE}>
              <Popup className="cyber-popup">
                <FarmPopup farm={farm} />
              </Popup>
            </Polygon>

            {/* Tractor icon planted at the plot's center - instantly
                recognizable at a glance, on top of the boundary itself. */}
            {center && (
              <Marker position={center} icon={farmerIcon}>
                <Popup className="cyber-popup">
                  <FarmPopup farm={farm} />
                </Popup>
              </Marker>
            )}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}

export default FarmersMap;
