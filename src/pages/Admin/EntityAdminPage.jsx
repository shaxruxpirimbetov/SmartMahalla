import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from '../../utils/leafletGlobal';
import GovPanel from '../../components/GovPanel';
import { getRayons, getMahallas, fetchAllPages } from '../../services/api';
import {
  GEOMETRY_LABEL,
  DrawControl,
  toFeatures,
  formatApiError,
} from './adminMapUtils';
import FieldsFormModal from './FieldsFormModal';
import './AdminShared.scss';

const DEFAULT_CENTER = [42.4602, 59.6073];
const DEFAULT_ZOOM = 8;

const RAYON_STYLE = { color: '#ff1493', weight: 2, fillOpacity: 0, fillColor: '#ff1493' };
const MAHALLA_STYLE = { color: '#10b981', weight: 1.5, fillOpacity: 0, fillColor: '#10b981' };

// Generic "draw a shape, fill a form, save it" admin page. Every dedicated
// Admin route (AdminRayonlar, AdminBusinesses, ...) is a thin wrapper that
// hands this one `module` config from entityModules.js - the map, the draw
// toolbar restricted to that module's geometry type, the save modal, and the
// reference layers all live here so the mechanics only exist once.
function EntityAdminPage({ module, subtitle }) {
  const [items, setItems] = useState([]);
  const [rayons, setRayons] = useState([]);
  const [mahallas, setMahallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [pending, setPending] = useState(null); // { layer, geojson }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const featureGroupRef = useRef(null);

  const needsRayon = Boolean(module.needsRayonContext) || module.fields.some((f) => f.optionsFrom === 'rayon');
  const needsMahalla =
    Boolean(module.needsMahallaContext) || module.fields.some((f) => f.optionsFrom === 'mahalla');

  const loadLists = useCallback(async () => {
    const [ownItems, rayonItems, mahallaItems] = await Promise.all([
      fetchAllPages(module.list),
      needsRayon ? fetchAllPages(getRayons) : Promise.resolve([]),
      needsMahalla ? fetchAllPages(getMahallas) : Promise.resolve([]),
    ]);
    return { ownItems, rayonItems, mahallaItems };
  }, [module, needsRayon, needsMahalla]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setListError('');
      try {
        const { ownItems, rayonItems, mahallaItems } = await loadLists();
        if (!cancelled) {
          setItems(ownItems);
          setRayons(rayonItems);
          setMahallas(mahallaItems);
        }
      } catch {
        if (!cancelled) setListError('Roʻyxatni yuklashda xatolik yuz berdi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadLists]);

  const rayonFeatures = useMemo(() => (needsRayon ? toFeatures(rayons, 'plot') : []), [needsRayon, rayons]);
  const mahallaFeatures = useMemo(
    () => (needsMahalla ? toFeatures(mahallas, 'plot') : []),
    [needsMahalla, mahallas]
  );
  const ownFeatures = useMemo(() => toFeatures(items, module.geoField), [items, module]);
  const rayonOptions = useMemo(() => rayons.map((r) => ({ value: r.id, label: r.name })), [rayons]);
  const mahallaOptions = useMemo(
    () => mahallas.map((m) => ({ value: m.id, label: m.name })),
    [mahallas]
  );

  const handleCreated = useCallback(
    (e) => {
      const layer = e.layer;
      // L.Marker has no setStyle - only Path layers (polygon/polyline) do.
      if (typeof layer.setStyle === 'function') {
        layer.setStyle({
          color: module.color,
          weight: 3,
          fillOpacity: 0.15,
          fillColor: module.color,
          dashArray: '6 6',
        });
      }
      setFormError('');
      setPending({ layer, geojson: layer.toGeoJSON() });
    },
    [module]
  );

  function discardPending() {
    if (pending?.layer && featureGroupRef.current) {
      featureGroupRef.current.removeLayer(pending.layer);
    }
    setPending(null);
    setFormError('');
  }

  async function handleSave(values) {
    if (!pending) return;
    setSaving(true);
    setFormError('');
    try {
      let payload = { ...values, [module.geoField]: pending.geojson };
      if (module.preparePayload) payload = module.preparePayload(payload);

      await module.create(payload);
      setSuccessMsg(`${module.label} muvaffaqiyatli saqlandi.`);

      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(pending.layer);
      }
      setPending(null);
      window.setTimeout(() => setSuccessMsg(''), 4000);

      // Refresh so the new item's own reference layer (and any select
      // options derived from it) are up to date immediately.
      try {
        const { ownItems, rayonItems, mahallaItems } = await loadLists();
        setItems(ownItems);
        setRayons(rayonItems);
        setMahallas(mahallaItems);
      } catch {
        // The save itself already succeeded - a failed refresh just means
        // the new item won't appear until the next reload.
      }
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      {listError && <p className="admin-page__error">{listError}</p>}
      {successMsg && <p className="admin-page__success">{successMsg}</p>}

      <GovPanel title="Chizish boʻyicha koʻrsatma" icon="✏️">
        <p className="panel-notice">
          {subtitle} Xaritada yuqori oʻng burchakdagi {GEOMETRY_LABEL[module.geometryType]} asbobi
          bilan chizing - shakl saqlanmaguncha havorang (#00e5ff) rangda koʻrinadi. Chizishni
          tugatgach, tafsilotlarni kiritish oynasi ochiladi.
        </p>
      </GovPanel>

      <GovPanel title="Xarita" icon="◈">
        <div className="entity-map-wrapper admin-page__map-wrapper">
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

            {rayonFeatures.length > 0 && (
              <GeoJSON
                key={`rayon-${rayonFeatures.map((f) => f.properties.id).join('-')}`}
                data={{ type: 'FeatureCollection', features: rayonFeatures }}
                style={RAYON_STYLE}
                onEachFeature={(feature, layer) =>
                  layer.bindTooltip(feature.properties.name, { sticky: true })
                }
              />
            )}

            {mahallaFeatures.length > 0 && (
              <GeoJSON
                key={`mahalla-${mahallaFeatures.map((f) => f.properties.id).join('-')}`}
                data={{ type: 'FeatureCollection', features: mahallaFeatures }}
                style={MAHALLA_STYLE}
                onEachFeature={(feature, layer) =>
                  layer.bindTooltip(feature.properties.name, { sticky: true })
                }
              />
            )}

            {ownFeatures.length > 0 && (
              <GeoJSON
                key={`own-${ownFeatures.map((f) => f.properties.id).join('-')}`}
                data={{ type: 'FeatureCollection', features: ownFeatures }}
                style={{ color: module.color, weight: 2, fillOpacity: 0.12, fillColor: module.color }}
                pointToLayer={(feature, latlng) =>
                  L.circleMarker(latlng, {
                    radius: 7,
                    color: module.color,
                    weight: 2,
                    fillColor: module.color,
                    fillOpacity: 0.6,
                  })
                }
                onEachFeature={(feature, layer) =>
                  layer.bindTooltip(feature.properties.name, { sticky: true })
                }
              />
            )}

            <FeatureGroup ref={featureGroupRef}>
              <DrawControl
                geometryType={module.geometryType}
                featureGroupRef={featureGroupRef}
                onCreated={handleCreated}
              />
            </FeatureGroup>
          </MapContainer>
        </div>
      </GovPanel>

      <GovPanel title="Holat" icon="☷">
        {loading ? (
          <p className="panel-notice">Yuklanmoqda...</p>
        ) : (
          <p className="panel-notice">{items.length} ta {module.label.toLowerCase()} yuklandi.</p>
        )}
      </GovPanel>

      {pending && (
        <FieldsFormModal
          title={`Yangi ${module.label.toLowerCase()}`}
          fields={module.fields}
          rayonOptions={rayonOptions}
          mahallaOptions={mahallaOptions}
          saving={saving}
          error={formError}
          onCancel={discardPending}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

export default EntityAdminPage;
