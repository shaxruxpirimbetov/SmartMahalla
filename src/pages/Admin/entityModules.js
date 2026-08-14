// One config object per drawable admin section - each dedicated Admin page
// (AdminRayonlar, AdminBusinesses, ...) is just this config handed to
// EntityAdminPage.jsx (Business/Farmer/Road) or GeoEntityAdminPage.jsx
// (Rayon/Mahalla), which own the actual map/draw/form mechanics.
import {
  getRayons,
  createRayon,
  getMahallas,
  createMahalla,
  getAholiVaBandlik,
  createAholiVaBandlik,
  getInfratuzilma,
  createInfratuzilma,
  getBusinesses,
  createBusiness,
  getFarmers,
  createFarmer,
  getRoads,
  createRoad,
  fetchAllPages,
} from '../../services/api';
import { getCurrentUserId } from '../../utils/auth';

// Shared by both Rayon and Mahalla's stats step (step 2 of the drawing
// workflow - see GeoEntityAdminPage.jsx) - the full "Kompleks Tahlil"
// demographic + infrastructure report, grouped into tabs (see
// STATS_SECTIONS) so FieldsFormModal doesn't dump 24 fields into one
// scrolling column.
//
// Every field's `name` is set to match its real backend column exactly (see
// `remote` below - `model` is which of AholiVaBandlik/InfratuzulmaTaxlili it
// belongs to, in apps/mahalla/models.py), so it doubles as the key in the
// merged record the Client Dashboard reads (Dashboard.jsx's
// `latestStatsByMahalla`) with no read-side remapping needed anywhere.
export const STATS_SECTIONS = [
  { key: 'demographics', label: 'Demografiya' },
  { key: 'bandlik', label: 'Bandlik va daromad' },
  { key: 'infrastructure', label: 'Infratuzilma' },
  { key: 'kommunal', label: 'Kommunal' },
];

const DEMOGRAPHICS_FIELDS = [
  {
    name: 'aholi_soni',
    label: 'Aholi jami (Umumiy aholi)',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'aholi_soni' },
  },
  {
    name: 'erkaklar_soni',
    label: 'Erkaklar',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'erkaklar_soni' },
  },
  {
    name: 'ayollar_soni',
    label: 'Ayollar',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'ayollar_soni' },
  },
  {
    name: 'yosh_0_6',
    label: '0-6 yosh',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'yosh_0_6' },
  },
  {
    name: 'yosh_0_18',
    label: '0-18 yosh',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'yosh_0_18' },
  },
  {
    name: 'yosh_14_30',
    label: '14-30 yosh',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'yosh_14_30' },
  },
  {
    name: 'yosh_60_plus',
    label: '60+ yosh',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'yosh_60_plus' },
  },
  {
    name: 'oylalar_soni',
    label: 'Oilalar (Families)',
    type: 'number',
    default: 0,
    section: 'demographics',
    remote: { model: 'avb', field: 'oylalar_soni' },
  },
];

const BANDLIK_FIELDS = [
  {
    name: 'band_aholi',
    label: 'Band aholi (Employed)',
    type: 'number',
    default: 0,
    section: 'bandlik',
    remote: { model: 'avb', field: 'band_aholi' },
  },
  {
    name: 'ishsizlar_soni',
    label: 'Ishsizlar soni (Unemployed)',
    type: 'number',
    default: 0,
    section: 'bandlik',
    remote: { model: 'avb', field: 'ishsizlar_soni' },
  },
  {
    name: 'kambagallik_darajasi',
    label: 'Kambagʻallik darajasi %, 0-100 (Poverty rate)',
    type: 'number',
    default: 0,
    section: 'bandlik',
    remote: { model: 'avb', field: 'kambagallik_darajasi' },
  },
  {
    name: 'urtacha_oylik_maosh',
    label: 'Oʻrtacha oylik maosh',
    type: 'number',
    default: 0,
    section: 'bandlik',
    remote: { model: 'avb', field: 'urtacha_oylik_maosh' },
  },
];

const INFRA_FIELDS = [
  {
    name: 'umumiy_maydon',
    label: 'Umumiy yer maydoni, ga (Total area)',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'infra', field: 'umumiy_maydon' },
  },
  {
    name: 'aholi_zichligi',
    label: 'Aholi zichligi (Density)',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'infra', field: 'aholi_zichligi' },
  },
  {
    name: 'kochalar_soni',
    label: 'Koʻchalar soni (Streets)',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'infra', field: 'kochalar_soni' },
  },
  {
    name: 'honadonlar_soni',
    label: 'Xonadonlar (Households)',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'avb', field: 'honadonlar_soni' },
  },
  {
    name: 'tomorqali_honadonlar',
    label: 'Tomorqasi bor xonadonlar',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'infra', field: 'tomorqali_honadonlar' },
  },
  {
    name: 'issiqxonalar_soni',
    label: 'Issiqxonalar (Greenhouses)',
    type: 'number',
    default: 0,
    section: 'infrastructure',
    remote: { model: 'infra', field: 'issiqxonalar_soni' },
  },
];

const KOMMUNAL_FIELDS = [
  {
    name: 'yollar_uzunligi',
    label: 'Yoʻllar uzunligi',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'yollar_uzunligi' },
  },
  {
    name: 'asfaltlangan_yollar_ulushi',
    label: 'Asfaltlangan yoʻllar ulushi %',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'asfaltlangan_yollar_ulushi' },
  },
  {
    name: 'elektr_uzulishlari',
    label: 'Elektr uzilishlari',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'elektr_uzulishlari' },
  },
  {
    name: 'gaz_bilantaminlanganlar',
    label: 'Gaz taʼminoti %',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'gaz_bilantaminlanganlar' },
  },
  {
    name: 'toza_ichimlik_suv_taminoti',
    label: 'Toza ichimlik suvi taʼminoti %',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'toza_ichimlik_suv_taminoti' },
  },
  {
    name: 'kanalizacia_tarmogi',
    label: 'Kanalizatsiya tarmogʻi %',
    type: 'number',
    default: 0,
    section: 'kommunal',
    remote: { model: 'infra', field: 'kanalizacia_tarmogi' },
  },
];

export const CORE_STATS_FIELDS = [
  ...DEMOGRAPHICS_FIELDS,
  ...BANDLIK_FIELDS,
  ...INFRA_FIELDS,
  ...KOMMUNAL_FIELDS,
];

// Splits a Kompleks Tahlil form's values across the two real backend
// endpoints that carry them (AholiVaBandlik/InfratuzulmaTaxlili - see
// CORE_STATS_FIELDS `remote` above), stamping whichever FK (`mahalla` or
// `rayon`) the caller is saving against onto both payloads. Shared by
// RAYON_MODULE.stats and MAHALLA_MODULE.stats below - the only difference
// between the two is which FK key they pass.
function splitStatsPayload(fkKey, itemId, values) {
  const avbPayload = { [fkKey]: itemId };
  const infraPayload = { [fkKey]: itemId };
  CORE_STATS_FIELDS.forEach((field) => {
    if (field.remote?.model === 'avb') {
      avbPayload[field.remote.field] = values[field.name];
    } else if (field.remote?.model === 'infra') {
      infraPayload[field.remote.field] = values[field.name];
    }
  });
  return Promise.all([createAholiVaBandlik(avbPayload), createInfratuzilma(infraPayload)]);
}

// Fetches every AVB + Infra snapshot saved against one FK (`mahalla` or
// `rayon`) and zips them back together by position into the merged shape
// the stats form edits - both are append-only logs (list-create, no update
// endpoint) written together by splitStatsPayload above, so position `i` in
// one always corresponds to the same save as position `i` in the other.
async function loadStatsSnapshots(params) {
  const [avb, infra] = await Promise.all([
    fetchAllPages(getAholiVaBandlik, params),
    fetchAllPages(getInfratuzilma, params),
  ]);
  const count = Math.max(avb.length, infra.length);
  return Array.from({ length: count }, (_, i) => ({ ...avb[i], ...infra[i] }));
}

export const RAYON_MODULE = {
  label: 'Rayon',
  geometryType: 'polygon',
  color: '#ff1493',
  geoField: 'plot',
  list: getRayons,
  create: createRayon,
  fields: [
    { name: 'name', label: 'Nomi', type: 'text' },
    { name: 'region', label: 'Region', type: 'text', default: 'Qoraqalpogʻiston' },
  ],
  // Rayon.creator is a required FK with no server-side default.
  preparePayload: (values) => {
    const creator = getCurrentUserId();
    return creator ? { ...values, creator } : values;
  },
  // Step 2 (see GeoEntityAdminPage.jsx): AholiVaBandlik/InfratuzulmaTaxlili
  // both carry an optional `rayon` FK alongside `mahalla` (see
  // apps/mahalla/models.py) specifically for this - a Rayon-level snapshot
  // for a Rayon that has no per-Mahalla breakdown yet.
  stats: {
    fields: CORE_STATS_FIELDS,
    sections: STATS_SECTIONS,
    list: (itemId) => loadStatsSnapshots({ rayon: itemId }),
    create: (itemId, values) => splitStatsPayload('rayon', itemId, values),
  },
};

export const MAHALLA_MODULE = {
  label: 'Mahalla',
  geometryType: 'polygon',
  color: '#10b981',
  geoField: 'plot',
  list: getMahallas,
  create: createMahalla,
  needsRayonContext: true,
  fields: [
    { name: 'name', label: 'Nomi', type: 'text' },
    { name: 'rayon', label: 'Rayon', type: 'select', optionsFrom: 'rayon' },
  ],
  preparePayload: (values) => ({ ...values, staff: [] }),
  // Step 2: splits the full Kompleks Tahlil form across AholiVaBandlik
  // (population/employment) and InfratuzulmaTaxlili (area/infra), both FK'd
  // to this mahalla - see CORE_STATS_FIELDS `remote` above. Each save
  // appends a new dated snapshot to both, matching how the backend models
  // are shaped (list-create, no update endpoint).
  stats: {
    fields: CORE_STATS_FIELDS,
    sections: STATS_SECTIONS,
    list: (itemId) => loadStatsSnapshots({ mahalla: itemId }),
    create: (itemId, values) => splitStatsPayload('mahalla', itemId, values),
  },
};

export const BUSINESS_MODULE = {
  label: 'Biznes',
  geometryType: 'marker',
  color: '#2563eb',
  geoField: 'location',
  list: getBusinesses,
  create: createBusiness,
  needsRayonContext: true,
  needsMahallaContext: true,
  fields: [
    { name: 'name', label: 'Biznes nomi', type: 'text' },
    { name: 'owner', label: 'Egasining F.I.Sh.', type: 'text' },
    // Tadbirkorlar.mahalla is a required FK - see apps/mahalla/models.py.
    { name: 'mahalla', label: 'Mahalla', type: 'select', optionsFrom: 'mahalla' },
    // Named `image` (not `photo`) to match Tadbirkorlar.image exactly - see
    // apps/mahalla/models.py - so api.js's createBusiness needs no
    // per-field remapping. Any common photo format - compressImageFile()
    // (see FieldsFormModal.jsx) re-encodes whatever's picked to JPEG anyway.
    { name: 'image', label: 'Rasm', type: 'image', accept: 'image/*' },
    { name: 'description', label: 'Qisqacha tavsif', type: 'textarea' },
  ],
};

export const FARMER_MODULE = {
  label: 'Fermer xoʻjaligi',
  geometryType: 'polygon',
  color: '#65a30d',
  geoField: 'plot',
  list: getFarmers,
  create: createFarmer,
  needsRayonContext: true,
  needsMahallaContext: true,
  fields: [
    { name: 'name', label: 'Fermerning F.I.Sh.', type: 'text' },
    { name: 'crop', label: 'Ekin turi', type: 'text' },
    // Farmer.mahalla is a required FK - see apps/land/models.py.
    { name: 'mahalla', label: 'Mahalla', type: 'select', optionsFrom: 'mahalla' },
    // Matches Farmer.photo exactly - see apps/land/models.py.
    { name: 'photo', label: 'Rasm', type: 'image', accept: 'image/*' },
    { name: 'description', label: 'Qisqacha tavsif', type: 'textarea' },
  ],
};

export const ROAD_MODULE = {
  label: 'Yoʻl',
  geometryType: 'polyline',
  color: '#ef4444',
  geoField: 'path',
  list: getRoads,
  create: createRoad,
  needsRayonContext: true,
  needsMahallaContext: true,
  fields: [
    { name: 'name', label: 'Yoʻl nomi', type: 'text' },
    // Road.rayon is a required FK - see apps/land/models.py.
    { name: 'rayon', label: 'Rayon', type: 'select', optionsFrom: 'rayon' },
    {
      name: 'condition',
      label: 'Holati',
      type: 'select',
      options: [
        { value: 'asphalt', label: 'Asfalt' },
        { value: 'gravel', label: 'Shagʻal' },
        { value: 'dirt', label: 'Tuproq' },
      ],
    },
  ],
};
