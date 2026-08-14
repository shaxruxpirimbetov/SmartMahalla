import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
// Order matters: this sets `window.L` before 'leaflet-draw' (a legacy
// plugin that reads Leaflet off the global scope) is imported for its side
// effects - see src/utils/leafletGlobal.js. react-leaflet-draw was tried
// first but its ESM build imports a default export from leaflet-draw's UMD
// bundle that doesn't exist, which breaks the production build under
// Vite/rolldown - so the drawing toolbar is wired up directly against
// leaflet-draw + react-leaflet's useMap() instead, in DrawControl below.
import L from '../../utils/leafletGlobal';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Shared by every Admin drawing page (EntityAdminPage.jsx for Business/
// Farmer/Road, GeoEntityAdminPage.jsx for Rayon/Mahalla) - single source of
// truth for the leaflet-draw wiring so both engines stay in sync.

export const GEOMETRY_LABEL = {
  marker: 'markyer',
  polyline: 'chiziq (polyline)',
  polygon: 'koʻpburchak (polygon)',
};

export function buildDrawOptions(geometryType) {
  const options = {
    polygon: false,
    polyline: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
    marker: false,
  };

  if (geometryType === 'polygon') {
    options.polygon = {
      allowIntersection: false,
      // leaflet-draw@1.0.4's readableArea() throws `ReferenceError: type is
      // not defined` against this Leaflet version whenever the live-area
      // tooltip is enabled - see readableArea in leaflet-draw/dist/leaflet.draw.js.
      // Not worth patching a vendored dependency for a cosmetic tooltip.
      showArea: false,
      shapeOptions: { color: '#00e5ff', weight: 3 },
    };
  } else if (geometryType === 'polyline') {
    options.polyline = { shapeOptions: { color: '#00e5ff', weight: 3 } };
  } else if (geometryType === 'marker') {
    options.marker = {};
  }

  return options;
}

// Hand-rolled replacement for react-leaflet-draw's <EditControl> (see the
// import comment above for why). Restricts the toolbar to exactly the one
// geometry type the page's module declares, wires its "created" event into
// `onCreated`, and lets its edit toolbar operate on the passed-in
// FeatureGroup (drawn-but-unsaved shapes only - reference layers live
// outside it).
export function DrawControl({ geometryType, featureGroupRef, onCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!featureGroupRef.current) return undefined;

    const control = new L.Control.Draw({
      position: 'topright',
      draw: buildDrawOptions(geometryType),
      edit: { featureGroup: featureGroupRef.current },
    });

    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
  }, [map, geometryType, featureGroupRef]);

  useEffect(() => {
    function handleCreated(e) {
      featureGroupRef.current?.addLayer(e.layer);
      onCreated(e);
    }

    map.on(L.Draw.Event.CREATED, handleCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
    };
  }, [map, featureGroupRef, onCreated]);

  return null;
}

export function toFeatures(items, geoField) {
  return items
    .filter((item) => item[geoField]?.geometry)
    .map((item) => ({
      ...item[geoField],
      properties: { id: item.id, name: item.name },
    }));
}

export function formatApiError(err) {
  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([field, msgs]) => `${field}: ${[].concat(msgs).join(', ')}`)
      .join(' | ');
  }
  return 'Saqlashda xatolik yuz berdi.';
}
