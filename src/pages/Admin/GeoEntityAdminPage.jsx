import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GovPanel from '../../components/GovPanel';
import { getRayons, fetchAllPages } from '../../services/api';
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

function byNewest(a, b) {
  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
}

// Two-step drawing/data-entry engine for the entities that carry backend
// statistics (Rayon, Mahalla - see entityModules.js RAYON_MODULE/
// MAHALLA_MODULE `stats`). Split view (map left, saved-items list right) so
// the map doesn't dominate the whole page, plus a click-to-open detail
// modal for the AVB/Infra-shaped stats form - see AdminRayonlar.jsx for how
// a module wires into this.
//
// Business/Farmer/Road have no such stats step and stay on the simpler,
// single-column EntityAdminPage.jsx.
function GeoEntityAdminPage({ module, subtitle }) {
  const [items, setItems] = useState([]);
  const [rayons, setRayons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: draw -> name it -> save.
  const [pending, setPending] = useState(null); // { layer, geojson }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Step 2: click a saved item in the list -> statistics modal.
  const [selectedItem, setSelectedItem] = useState(null);
  const [statsInitial, setStatsInitial] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsError, setStatsError] = useState('');

  const featureGroupRef = useRef(null);

  // Rayon is both a reference layer (drawing Mahalla boundaries inside a
  // rayon's outline) and the source of the "which rayon" select field, so
  // it's fetched whenever the module needs either.
  const needsRayon =
    Boolean(module.needsRayonContext) || module.fields.some((f) => f.optionsFrom === 'rayon');

  const loadItems = useCallback(async () => {
    const [ownItems, rayonItems] = await Promise.all([
      fetchAllPages(module.list),
      needsRayon ? fetchAllPages(getRayons) : Promise.resolve([]),
    ]);
    return { ownItems, rayonItems };
  }, [module, needsRayon]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setListError('');
      try {
        const { ownItems, rayonItems } = await loadItems();
        if (!cancelled) {
          setItems(ownItems);
          setRayons(rayonItems);
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
  }, [loadItems]);

  const rayonFeatures = useMemo(() => (needsRayon ? toFeatures(rayons, 'plot') : []), [needsRayon, rayons]);
  const ownFeatures = useMemo(() => toFeatures(items, module.geoField), [items, module]);
  const rayonOptions = useMemo(() => rayons.map((r) => ({ value: r.id, label: r.name })), [rayons]);
  const sortedItems = useMemo(() => [...items].sort(byNewest), [items]);

  const handleCreated = useCallback(
    (e) => {
      const layer = e.layer;
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

  // ---- Step 1: draw -> name -> save --------------------------------------

  async function handleSaveShape(values) {
    if (!pending) return;
    setSaving(true);
    setFormError('');
    try {
      let payload = { ...values, [module.geoField]: pending.geojson };
      if (module.preparePayload) payload = module.preparePayload(payload);

      const result = await module.create(payload);
      setSuccessMsg(
        result?.savedLocally
          ? `${module.label} lokal saqlandi (server ulanmadi) - roʻyxatda koʻrinadi.`
          : `${module.label} muvaffaqiyatli saqlandi.`
      );

      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(pending.layer);
      }
      setPending(null);
      window.setTimeout(() => setSuccessMsg(''), 4000);

      try {
        const { ownItems, rayonItems } = await loadItems();
        setItems(ownItems);
        setRayons(rayonItems);
      } catch {
        // Save already succeeded - a failed refresh just delays the new
        // item showing up in the list until the next reload.
      }
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 2: click item -> statistics modal ----------------------------

  async function openStats(item) {
    setSelectedItem(item);
    setStatsError('');
    setStatsInitial({});
    if (!module.stats) return;

    setStatsLoading(true);
    try {
      const rows = await module.stats.list(item.id);
      const latest = rows[rows.length - 1];
      if (latest) {
        setStatsInitial(
          Object.fromEntries(
            module.stats.fields.map((f) => [f.name, latest[f.name] ?? f.default ?? ''])
          )
        );
      }
    } catch {
      // No previous snapshot (or the fetch failed) - the form just opens
      // with its defaults, which is a fine fallback either way.
    } finally {
      setStatsLoading(false);
    }
  }

  function closeStats() {
    setSelectedItem(null);
    setStatsError('');
  }

  async function handleSaveStats(values) {
    if (!selectedItem || !module.stats) return;
    setStatsSaving(true);
    setStatsError('');
    try {
      const numericValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
      );
      await module.stats.create(selectedItem.id, numericValues);
      setSuccessMsg(`${selectedItem.name} uchun statistika saqlandi.`);
      window.setTimeout(() => setSuccessMsg(''), 4000);
      setSelectedItem(null);
    } catch (err) {
      setStatsError(formatApiError(err));
    } finally {
      setStatsSaving(false);
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
          tugatgach, nomini kiriting va saqlang. Soʻng, oʻng tarafdagi roʻyxatdan shu obyektni
          bosib, statistik maʼlumotlarni toʻldiring.
        </p>
      </GovPanel>

      <div className="geo-admin__split">
        <GovPanel title="Xarita" icon="◈" className="geo-admin__map-panel">
          <div className="entity-map-wrapper geo-admin__map-wrapper">
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

              {ownFeatures.length > 0 && (
                <GeoJSON
                  key={`own-${ownFeatures.map((f) => f.properties.id).join('-')}`}
                  data={{ type: 'FeatureCollection', features: ownFeatures }}
                  style={{ color: module.color, weight: 2, fillOpacity: 0.12, fillColor: module.color }}
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

        <GovPanel title={`Saqlangan obyektlar (${items.length})`} icon="☷" className="geo-admin__list-panel">
          {loading ? (
            <p className="panel-notice">Yuklanmoqda...</p>
          ) : sortedItems.length === 0 ? (
            <p className="panel-notice">
              Hali hech narsa chizilmagan. Xaritada chizib, nomini kiriting.
            </p>
          ) : (
            <ul className="geo-admin__list">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`geo-admin__list-item ${
                      selectedItem?.id === item.id ? 'is-selected' : ''
                    }`}
                    onClick={() => openStats(item)}
                  >
                    <span
                      className="geo-admin__list-dot"
                      style={{ background: module.color }}
                      aria-hidden="true"
                    />
                    <span className="geo-admin__list-name">{item.name}</span>
                    {item._local && <span className="geo-admin__list-badge">mahalliy</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GovPanel>
      </div>

      {pending && (
        <FieldsFormModal
          title={`Yangi ${module.label.toLowerCase()}`}
          fields={module.fields}
          rayonOptions={rayonOptions}
          saving={saving}
          error={formError}
          onCancel={discardPending}
          onSubmit={handleSaveShape}
        />
      )}

      {selectedItem && module.stats && (
        <FieldsFormModal
          // FieldsFormModal seeds its form state once, on mount - and
          // `statsInitial` only arrives after the async lookup in
          // openStats() resolves, which happens *after* this modal is
          // already open. Keying on the loading state forces a remount
          // (fresh initializer) the moment the real values land, instead of
          // silently opening pre-filled with stale defaults forever.
          key={`${selectedItem.id}-${statsLoading ? 'loading' : 'ready'}`}
          title={`${selectedItem.name} — statistika`}
          fields={module.stats.fields}
          sections={module.stats.sections}
          initialValues={statsInitial}
          saving={statsSaving || statsLoading}
          error={statsError}
          submitLabel={statsLoading ? 'Yuklanmoqda...' : 'Statistikani saqlash'}
          cancelLabel="Yopish"
          onCancel={closeStats}
          onSubmit={handleSaveStats}
        />
      )}
    </div>
  );
}

export default GeoEntityAdminPage;
