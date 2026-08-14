import { resolveMediaUrl } from '../services/api';

// Shared Leaflet popup content for Business (Tadbirkorlar) and Farmer
// markers - used by BusinessesMap/FarmersMap (their own dedicated pages) and
// DashboardMap (the combined overview map), so all three render the same
// name/photo/description card instead of three drifting copies. Wrap the
// output in a react-leaflet <Popup className="cyber-popup"> (see
// mapTheme.scss for that theme) - these components only render the inner
// content.

export function BusinessPopup({ business }) {
  // Tadbirkorlar.image (apps/mahalla/models.py) comes back as a path
  // relative to the backend's MEDIA_URL, not a usable <img src> on its own -
  // see resolveMediaUrl in api.js.
  const imageUrl = resolveMediaUrl(business.image);
  return (
    <div className="map-popup">
      {imageUrl ? (
        <img src={imageUrl} alt={business.name} className="map-popup__image" />
      ) : (
        <div className="map-popup__image map-popup__image--placeholder">Rasm yoʻq</div>
      )}
      <h4 className="map-popup__title">{business.name || 'Nomsiz biznes'}</h4>
      {business.owner && <p className="map-popup__meta">{business.owner}</p>}
      <p className="map-popup__desc">{business.description || 'Maʼlumot kiritilmagan.'}</p>
    </div>
  );
}

export function FarmPopup({ farm }) {
  // Farmer.photo (apps/land/models.py) comes back as a path relative to the
  // backend's MEDIA_URL, not a usable <img src> on its own - see
  // resolveMediaUrl in api.js.
  const photoUrl = resolveMediaUrl(farm.photo);
  return (
    <div className="map-popup">
      {photoUrl ? (
        <img src={photoUrl} alt={farm.name} className="map-popup__image" />
      ) : (
        <div className="map-popup__image map-popup__image--placeholder">Rasm yoʻq</div>
      )}
      <h4 className="map-popup__title">{farm.name || 'Nomsiz fermer'}</h4>
      {farm.crop && <p className="map-popup__meta">{farm.crop}</p>}
      <p className="map-popup__desc">{farm.description || 'Maʼlumot kiritilmagan.'}</p>
    </div>
  );
}
