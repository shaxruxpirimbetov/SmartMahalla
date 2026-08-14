import { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import GovPanel from '../../components/GovPanel';
import DashboardMap from './DashboardMap';
import {
  getAholiVaBandlik,
  getInfratuzilma,
  getMahallas,
  getRayons,
  getBusinesses,
  getFarmers,
  fetchAllPagesSafe,
} from '../../services/api';
import './Dashboard.scss';

function sumField(list, field) {
  return list.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function averageField(list, field) {
  if (!list.length) return 0;
  return sumField(list, field) / list.length;
}

// Groups a flat list of AVB/Infra/extra-stats rows by their `mahalla` (or
// `rayon`) foreign key, so per-area snapshots can be picked back out below.
function groupByKey(list, key) {
  const map = {};
  list.forEach((item) => {
    const k = item[key];
    if (k == null) return;
    (map[k] ??= []).push(item);
  });
  return map;
}

// Every numeric field the Admin's Kompleks Tahlil form collects (see
// entityModules.js CORE_STATS_FIELDS) - split into "sum across regions" vs
// "average across regions" so aggregating (whole country / a Rayon's
// Mahallas) does the sensible thing for each: population/counts add up,
// rates/densities/averages don't.
const SUM_FIELDS = [
  'aholi_soni',
  'erkaklar_soni',
  'ayollar_soni',
  'yosh_0_6',
  'yosh_0_18',
  'yosh_14_30',
  'yosh_60_plus',
  'oylalar_soni',
  'band_aholi',
  'ishsizlar_soni',
  'umumiy_maydon',
  'kochalar_soni',
  'honadonlar_soni',
  'tomorqali_honadonlar',
  'issiqxonalar_soni',
  'yollar_uzunligi',
  'elektr_uzulishlari',
];
const AVG_FIELDS = [
  'kambagallik_darajasi',
  'urtacha_oylik_maosh',
  'aholi_zichligi',
  'asfaltlangan_yollar_ulushi',
  'gaz_bilantaminlanganlar',
  'toza_ichimlik_suv_taminoti',
  'kanalizacia_tarmogi',
];

function aggregateRecords(records) {
  const result = {};
  SUM_FIELDS.forEach((f) => {
    result[f] = sumField(records, f);
  });
  AVG_FIELDS.forEach((f) => {
    result[f] = averageField(records, f);
  });
  return result;
}

const PIE_COLORS = ['#2563eb', '#dc2626', '#16a34a'];

function StatRow({ label, value, tone = 'blue' }) {
  return (
    <li className="stat-row">
      <span className="stat-row__label">{label}</span>
      <strong className={`stat-row__value stat-row__value--${tone}`}>
        {value}
      </strong>
    </li>
  );
}

function StatRowSkeleton() {
  return (
    <li className="stat-row stat-row--skeleton">
      <span className="skeleton-bar skeleton-bar--label" />
      <span className="skeleton-bar skeleton-bar--value" />
    </li>
  );
}

function StatListSkeleton({ rows = 4 }) {
  return (
    <ul className="stat-list">
      {Array.from({ length: rows }).map((_, i) => (
        <StatRowSkeleton key={i} />
      ))}
    </ul>
  );
}

function Spinner() {
  return (
    <div className="panel-overlay">
      <span className="spinner" />
    </div>
  );
}

function Dashboard() {
  // AVB/Infra rows each carry either a `mahalla` id or a `rayon` id (never
  // both - see apps/mahalla/models.py) - a Mahalla-level snapshot, or a
  // directly-entered Rayon-level one for a Rayon with no per-Mahalla
  // breakdown yet (RAYON_MODULE.stats in entityModules.js). Both shapes come
  // back mixed together in one fetch; `rayonStatsByRayon` below picks the
  // rayon-tagged rows back out.
  const [avbData, setAvbData] = useState([]);
  const [infraData, setInfraData] = useState([]);
  const [mahallaData, setMahallaData] = useState([]);
  const [rayonData, setRayonData] = useState([]);
  const [businessData, setBusinessData] = useState([]);
  const [farmerData, setFarmerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infraError, setInfraError] = useState('');
  // Non-blocking notice for Business/Farmer specifically - see
  // loadDashboardData below: unlike `error`, this never means "the
  // dashboard failed to load", only "these two panels are empty because
  // their endpoint didn't respond", so it never stops the rest of the page
  // from rendering with whatever data did come back.
  const [entityWarning, setEntityWarning] = useState('');
  // On/off switch for the map overlay toolbar - "Hamma maʼlumotlar" shows
  // every Rayon/Mahalla boundary, "Tozalash" clears them, leaving the bare map.
  const [showMapData, setShowMapData] = useState(true);
  // The region currently focused via a map click or a "Mahallalar roʻyxati"
  // row click - `{ type: 'rayon' | 'mahalla', id, name }` or null. Drives
  // every stat panel below; null means "show the aggregate of everything".
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError('');
      setInfraError('');
      setEntityWarning('');
      try {
        // AVB (`/mahalla/avb/`) and Infra (`/mahalla/infra/`) records only
        // carry `mahalla`/`rayon` as an id, never a nested object, so
        // Mahalla and Rayon are fetched too, purely to resolve id -> name
        // for the map/table below. Fetched with no params, so this pulls
        // back every snapshot - both Mahalla- and Rayon-tagged.
        //
        // Every fetch here uses the "safe" variant (never throws, resolves
        // to `{ data, error }`) - previously only Infra did, which meant a
        // single failing endpoint (a 500, or - as actually happened here -
        // a 404 because Business/Farmer/Road weren't deployed to the live
        // backend yet) rejected this whole Promise.all and blanked every
        // panel, including the ones backed by endpoints that were working
        // fine. Each result is applied independently below instead, so one
        // bad endpoint only empties its own panel(s).
        const [aResult, iResult, mResult, rResult, bizResult, farmResult] = await Promise.all([
          fetchAllPagesSafe(getAholiVaBandlik),
          fetchAllPagesSafe(getInfratuzilma),
          fetchAllPagesSafe(getMahallas),
          fetchAllPagesSafe(getRayons),
          fetchAllPagesSafe(getBusinesses),
          fetchAllPagesSafe(getFarmers),
        ]);

        if (!cancelled) {
          setAvbData(aResult.data);
          setInfraData(iResult.data);
          setMahallaData(mResult.data);
          setRayonData(rResult.data);
          setBusinessData(bizResult.data);
          setFarmerData(farmResult.data);

          if (iResult.error) {
            setInfraError(
              'Infratuzilma maʼlumotlari yuklanmadi: backend serverida xatolik (500). Bu frontenddagi muammo emas.'
            );
          }
          if (aResult.error || mResult.error || rResult.error) {
            setError('Maʼlumotlarni yuklashda xatolik yuz berdi.');
          }
          // Business/Farmer endpoints 404ing specifically means the live
          // backend just hasn't been redeployed with those routes yet (see
          // apps/land/urls.py, apps/mahalla/urls.py) - worth a heads-up, but
          // not worth blocking the rest of the dashboard over.
          const missing = [
            bizResult.error && 'Bizneslar',
            farmResult.error && 'Fermerlar',
          ].filter(Boolean);
          if (missing.length) {
            setEntityWarning(
              `${missing.join(' va ')} maʼlumotlari yuklanmadi (backend endpointi hozircha mavjud emas) - qolgan panellar odatdagidek koʻrsatilmoqda.`
            );
          }
        }
      } catch {
        if (!cancelled) {
          setError('Maʼlumotlarni yuklashda xatolik yuz berdi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  // id -> record lookups, used to resolve Mahalla `rayon` ids to names.
  const rayonById = useMemo(() => {
    const map = {};
    rayonData.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [rayonData]);

  // mahalla id -> the latest merged AVB + Infra snapshot for that Mahalla
  // (each source is an append-only log - see MAHALLA_MODULE.stats in
  // entityModules.js - so "latest" is simply the last entry of each, zipped
  // together the same way the Admin edit form does). Only rows carrying a
  // `mahalla` id are considered here - see rayonStatsByRayon below for the
  // `rayon`-tagged ones.
  const latestStatsByMahalla = useMemo(() => {
    const avbByM = groupByKey(avbData, 'mahalla');
    const infraByM = groupByKey(infraData, 'mahalla');
    const map = {};
    mahallaData.forEach((m) => {
      const avbList = avbByM[m.id] || [];
      const infraList = infraByM[m.id] || [];
      if (!avbList.length && !infraList.length) return;
      map[m.id] = {
        ...avbList[avbList.length - 1],
        ...infraList[infraList.length - 1],
      };
    });
    return map;
  }, [avbData, infraData, mahallaData]);

  // rayon id -> latest directly-entered Rayon-level snapshot (rows where
  // `rayon` is set instead of `mahalla` - see RAYON_MODULE.stats in
  // entityModules.js). Same zip-by-position merge as latestStatsByMahalla.
  const rayonStatsByRayon = useMemo(() => {
    const avbByR = groupByKey(avbData, 'rayon');
    const infraByR = groupByKey(infraData, 'rayon');
    const map = {};
    rayonData.forEach((r) => {
      const avbList = avbByR[r.id] || [];
      const infraList = infraByR[r.id] || [];
      if (!avbList.length && !infraList.length) return;
      map[r.id] = {
        ...avbList[avbList.length - 1],
        ...infraList[infraList.length - 1],
      };
    });
    return map;
  }, [avbData, infraData, rayonData]);

  const mahallaRecords = useMemo(
    () => Object.values(latestStatsByMahalla),
    [latestStatsByMahalla]
  );

  // The single merged record every stat panel below reads from - resolves
  // `selectedArea` into either one Mahalla's snapshot, a Rayon's Mahallas
  // summed together (falling back to that Rayon's own local snapshot if it
  // has no Mahallas with stats yet), or - when nothing is selected - the
  // sum/average of every Mahalla, i.e. the whole map's aggregate.
  const areaStats = useMemo(() => {
    if (!selectedArea) {
      return { record: aggregateRecords(mahallaRecords), hasData: mahallaRecords.length > 0 };
    }
    if (selectedArea.type === 'mahalla') {
      const record = latestStatsByMahalla[selectedArea.id];
      return { record: record ?? aggregateRecords([]), hasData: Boolean(record) };
    }
    const childRecords = mahallaData
      .filter((m) => String(m.rayon) === String(selectedArea.id))
      .map((m) => latestStatsByMahalla[m.id])
      .filter(Boolean);
    if (childRecords.length > 0) {
      return { record: aggregateRecords(childRecords), hasData: true };
    }
    const ownRecord = rayonStatsByRayon[selectedArea.id];
    return { record: ownRecord ?? aggregateRecords([]), hasData: Boolean(ownRecord) };
  }, [selectedArea, mahallaRecords, latestStatsByMahalla, mahallaData, rayonStatsByRayon]);

  const stats = areaStats.record;

  // Clicking the already-selected region (on the map or in the table below)
  // clears the selection back to the aggregate view.
  function handleSelectArea(area) {
    setSelectedArea((prev) =>
      prev && prev.type === area.type && String(prev.id) === String(area.id) ? null : area
    );
  }

  // ---- Demografiya ----
  const totalPopulation = Number(stats.aholi_soni) || 0;
  const totalMen = Number(stats.erkaklar_soni) || 0;
  const totalWomen = Number(stats.ayollar_soni) || 0;
  const totalFamilies = Number(stats.oylalar_soni) || 0;
  const age0_6 = Number(stats.yosh_0_6) || 0;
  const age0_18 = Number(stats.yosh_0_18) || 0;
  const age14_30 = Number(stats.yosh_14_30) || 0;
  const age60plus = Number(stats.yosh_60_plus) || 0;

  // ---- Bandlik va daromad ----
  const totalEmployed = Number(stats.band_aholi) || 0;
  const totalUnemployed = Number(stats.ishsizlar_soni) || 0;
  const avgPoverty = Number(stats.kambagallik_darajasi) || 0;
  const avgSalary = Number(stats.urtacha_oylik_maosh) || 0;

  // ---- Infratuzilma ----
  const totalArea = Number(stats.umumiy_maydon) || 0;
  const avgDensity = Number(stats.aholi_zichligi) || 0;
  const totalStreets = Number(stats.kochalar_soni) || 0;
  const totalHouseholds = Number(stats.honadonlar_soni) || 0;
  const gardenHouseholds = Number(stats.tomorqali_honadonlar) || 0;
  const greenhouses = Number(stats.issiqxonalar_soni) || 0;

  // ---- Kommunal ----
  const totalRoadLength = Number(stats.yollar_uzunligi) || 0;
  const avgAsphaltShare = Number(stats.asfaltlangan_yollar_ulushi) || 0;
  const electricityOutages = Number(stats.elektr_uzulishlari) || 0;
  const avgGasSupply = Number(stats.gaz_bilantaminlanganlar) || 0;
  const avgCleanWaterSupply = Number(stats.toza_ichimlik_suv_taminoti) || 0;
  const avgSewerNetwork = Number(stats.kanalizacia_tarmogi) || 0;

  const employmentRate = totalPopulation
    ? ((totalEmployed / totalPopulation) * 100).toFixed(1)
    : '0.0';
  const unemploymentRate = totalPopulation
    ? ((totalUnemployed / totalPopulation) * 100).toFixed(1)
    : '0.0';

  const demographicsData = [
    { name: 'Band aholi', value: totalEmployed },
    { name: 'Ishsizlar', value: totalUnemployed },
    {
      name: 'Boshqa',
      value: Math.max(totalPopulation - totalEmployed - totalUnemployed, 0),
    },
  ];

  // Top-5 by population - scoped to the selected Rayon's own Mahallas when
  // one is selected, the whole map otherwise. A single selected Mahalla
  // keeps showing the full ranking (a 1-bar chart isn't useful).
  const topMahallas = useMemo(() => {
    const pool =
      selectedArea?.type === 'rayon'
        ? mahallaData.filter((m) => String(m.rayon) === String(selectedArea.id))
        : mahallaData;
    return pool
      .map((m) => ({
        name: m.name,
        aholi_soni: Number(latestStatsByMahalla[m.id]?.aholi_soni) || 0,
      }))
      .sort((a, b) => b.aholi_soni - a.aholi_soni)
      .slice(0, 5);
  }, [mahallaData, latestStatsByMahalla, selectedArea]);

  return (
    <div className="dashboard">
      <div className="dashboard__content">
        {error && <p className="dashboard__error">{error}</p>}
        {infraError && <p className="dashboard__error dashboard__error--warn">{infraError}</p>}
        {entityWarning && <p className="dashboard__error dashboard__error--warn">{entityWarning}</p>}

        <div className={`area-banner ${selectedArea ? 'area-banner--active' : ''}`}>
          {selectedArea ? (
            <>
              <span className="area-banner__icon" aria-hidden="true">
                📍
              </span>
              <span className="area-banner__text">
                <strong>{selectedArea.name}</strong>
                <span className="area-banner__type">
                  {selectedArea.type === 'rayon' ? 'Rayon' : 'Mahalla'}
                </span>
                {!areaStats.hasData && (
                  <span className="area-banner__notice">
                     — bu hudud uchun statistika hali kiritilmagan
                  </span>
                )}
              </span>
              <button
                type="button"
                className="area-banner__clear"
                onClick={() => setSelectedArea(null)}
              >
                Tozalash
              </button>
            </>
          ) : (
            <span className="area-banner__text">
              <span className="area-banner__icon" aria-hidden="true">
                📍
              </span>
              Xaritadan hududni tanlang — hozircha barcha hududlar yigʻindisi koʻrsatilmoqda.
            </span>
          )}
        </div>

        <div className="main-grid">
          <div className="col col-left">
            <GovPanel title="Aholi statistikasi" icon="▤">
              {loading ? (
                <StatListSkeleton rows={4} />
              ) : (
                <ul className="stat-list">
                  <StatRow
                    label="Umumiy aholi"
                    value={totalPopulation.toLocaleString()}
                    tone="blue"
                  />
                  <StatRow label="Erkaklar" value={totalMen.toLocaleString()} tone="blue" />
                  <StatRow label="Ayollar" value={totalWomen.toLocaleString()} tone="blue" />
                  <StatRow label="Oilalar" value={totalFamilies.toLocaleString()} tone="green" />
                </ul>
              )}
            </GovPanel>

            <GovPanel title="Demografiya" icon="◉">
              <div className="chart-wrapper">
                {loading && <Spinner />}
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={demographicsData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {demographicsData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dbe4f3',
                        borderRadius: 8,
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {!loading && (
                <ul className="stat-list stat-list--compact">
                  <StatRow label="0-6 yosh" value={age0_6.toLocaleString()} tone="blue" />
                  <StatRow label="0-18 yosh" value={age0_18.toLocaleString()} tone="blue" />
                  <StatRow label="14-30 yosh" value={age14_30.toLocaleString()} tone="green" />
                  <StatRow label="60+ yosh" value={age60plus.toLocaleString()} tone="yellow" />
                </ul>
              )}
            </GovPanel>

            <GovPanel title="Top mahallalar (aholi)" icon="▲">
              <div className="chart-wrapper">
                {loading && <Spinner />}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topMahallas} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      stroke="#94a3b8"
                      tick={{ fill: '#334155', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dbe4f3',
                        borderRadius: 8,
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                      }}
                    />
                    <Bar dataKey="aholi_soni" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GovPanel>
          </div>

          <div className="col col-center">
            <GovPanel title="Mahalla xaritasi" icon="◈" className="map-panel">
              <div className="map-wrapper">
                <div className="map-toolbar" role="group" aria-label="Xarita maʼlumotlari">
                  <button
                    type="button"
                    className={`map-toolbar__btn map-toolbar__btn--all ${showMapData ? 'is-active' : ''}`}
                    onClick={() => setShowMapData(true)}
                  >
                    Hamma maʼlumotlar
                  </button>
                  <button
                    type="button"
                    className={`map-toolbar__btn map-toolbar__btn--clear ${!showMapData ? 'is-active' : ''}`}
                    onClick={() => setShowMapData(false)}
                  >
                    Tozalash
                  </button>
                </div>
                <DashboardMap
                  rayons={rayonData}
                  mahallas={mahallaData}
                  businesses={businessData}
                  farmers={farmerData}
                  showData={showMapData}
                  selectedArea={selectedArea}
                  onSelectArea={handleSelectArea}
                />
              </div>
            </GovPanel>

            <GovPanel title="Mahallalar roʻyxati" icon="☷">
              <div className="table-wrapper">
                {loading && <Spinner />}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rayon</th>
                      <th>Mahalla</th>
                      <th>Aholi</th>
                      <th>Kambagʻallik %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && mahallaData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="data-table__empty">
                          Maʼlumot topilmadi.
                        </td>
                      </tr>
                    ) : (
                      mahallaData.map((m) => {
                        const record = latestStatsByMahalla[m.id];
                        const isRowSelected =
                          selectedArea?.type === 'mahalla' &&
                          String(selectedArea.id) === String(m.id);
                        return (
                          <tr
                            key={m.id}
                            className={isRowSelected ? 'is-selected' : ''}
                            onClick={() =>
                              handleSelectArea({ type: 'mahalla', id: m.id, name: m.name })
                            }
                          >
                            <td>{rayonById[m.rayon]?.name ?? '—'}</td>
                            <td>{m.name}</td>
                            <td>{Number(record?.aholi_soni || 0).toLocaleString()}</td>
                            <td>{Number(record?.kambagallik_darajasi || 0).toFixed(1)}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GovPanel>
          </div>

          <div className="col col-right">
            <GovPanel title="Infratuzilma" icon="⚙">
              {loading ? (
                <StatListSkeleton rows={4} />
              ) : infraError ? (
                <p className="panel-notice">Maʼlumot mavjud emas (server xatosi)</p>
              ) : (
                <ul className="stat-list">
                  <StatRow
                    label="Umumiy yer maydoni"
                    value={totalArea.toLocaleString()}
                    tone="blue"
                  />
                  <StatRow
                    label="Aholi zichligi"
                    value={avgDensity.toFixed(1)}
                    tone="blue"
                  />
                  <StatRow
                    label="Koʻchalar soni"
                    value={totalStreets.toLocaleString()}
                    tone="blue"
                  />
                  <StatRow
                    label="Xonadonlar"
                    value={totalHouseholds.toLocaleString()}
                    tone="green"
                  />
                  <StatRow
                    label="Tomorqali xonadonlar"
                    value={gardenHouseholds.toLocaleString()}
                    tone="green"
                  />
                  <StatRow
                    label="Issiqxonalar"
                    value={greenhouses.toLocaleString()}
                    tone="yellow"
                  />
                </ul>
              )}
            </GovPanel>

            <GovPanel title="Kommunal" icon="⚡">
              {loading ? (
                <StatListSkeleton rows={4} />
              ) : infraError ? (
                <p className="panel-notice">Maʼlumot mavjud emas (server xatosi)</p>
              ) : (
                <ul className="stat-list">
                  <StatRow
                    label="Yoʻllar uzunligi"
                    value={totalRoadLength.toLocaleString()}
                    tone="blue"
                  />
                  <StatRow
                    label="Asfaltlangan yoʻllar"
                    value={`${avgAsphaltShare.toFixed(1)}%`}
                    tone="yellow"
                  />
                  <StatRow
                    label="Elektr uzilishlari"
                    value={electricityOutages.toLocaleString()}
                    tone="red"
                  />
                  <StatRow
                    label="Gaz taʼminoti"
                    value={`${avgGasSupply.toFixed(1)}%`}
                    tone="yellow"
                  />
                  <StatRow
                    label="Toza suv taʼminoti"
                    value={`${avgCleanWaterSupply.toFixed(1)}%`}
                    tone="green"
                  />
                  <StatRow
                    label="Kanalizatsiya tarmogʻi"
                    value={`${avgSewerNetwork.toFixed(1)}%`}
                    tone="blue"
                  />
                </ul>
              )}
            </GovPanel>

            <GovPanel title="Iqtisodiyot" icon="◆">
              {loading ? (
                <StatListSkeleton rows={4} />
              ) : (
                <ul className="stat-list">
                  <StatRow
                    label="Bandlik darajasi"
                    value={`${employmentRate}%`}
                    tone="green"
                  />
                  <StatRow
                    label="Ishsizlik darajasi"
                    value={`${unemploymentRate}%`}
                    tone="red"
                  />
                  <StatRow
                    label="Kambagʻallik darajasi"
                    value={`${avgPoverty.toFixed(1)}%`}
                    tone="yellow"
                  />
                  <StatRow
                    label="Oʻrtacha oylik maosh"
                    value={avgSalary.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                    tone="blue"
                  />
                </ul>
              )}
            </GovPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
