import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Store } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { pointToLatLng } from '../../utils/geo';
import { createLucideMarkerIcon } from '../../utils/mapIcons';
import { BusinessPopup } from '../../components/MapPopups';

// Nukus, Karakalpakstan - locked default view, matches every other map in
// the app (see SmartMahalla_API_Hujjat.md §4.1 for the region default).
const KARAKALPAKSTAN_CENTER = [42.4602, 59.6073];
const KARAKALPAKSTAN_ZOOM = 8;

// Large, high-contrast marker (solid blue circle, white border) - see
// src/utils/mapIcons.jsx - instead of the old small default-pin/emoji
// marker, so a Business is unmistakable against the satellite basemap.
const businessIcon = createLucideMarkerIcon(Store, { modifier: 'business' });

// Dedicated Bizneslar map - shows only business markers, drawn by the admin
// at /admin/businesses and persisted to the real Tadbirkorlar backend model
// (see src/services/api.js).
function BusinessesMap({ businesses = [] }) {
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

      {businesses.map((business) => {
        const position = pointToLatLng(business.location);
        if (!position) return null;
        return (
          <Marker key={business.id} position={position} icon={businessIcon}>
            <Popup className="cyber-popup">
              <BusinessPopup business={business} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default BusinessesMap;
