import { useEffect, useMemo, useState } from 'react';
import GovPanel from '../../components/GovPanel';
import RoadsMap from './RoadsMap';
import { ROAD_CONDITIONS } from '../../services/roadConditions';
import { getRoads, fetchAllPages } from '../../services/api';
import './Roads.scss';

const CONDITION_TONE = { asphalt: 'green', gravel: 'yellow', dirt: 'red' };

// Client view of Admin-drawn roads (see /admin/roads) - backed by the real
// Road backend model, see src/services/api.js.
function Roads() {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllPages(getRoads);
        if (!cancelled) setRoads(data);
      } catch {
        if (!cancelled) setError('Yoʻllar roʻyxatini yuklashda xatolik yuz berdi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const conditionCounts = useMemo(() => {
    const counts = { asphalt: 0, gravel: 0, dirt: 0 };
    roads.forEach((road) => {
      counts[road.condition] += 1;
    });
    return counts;
  }, [roads]);

  return (
    <div className="roads">
      <header className="roads__header">
        <div>
          <h1 className="roads__title">YOʻLLAR</h1>
          <p className="roads__subtitle">Infratuzilma // {roads.length} ta yoʻl</p>
        </div>
      </header>

      {error && <p className="roads__error">{error}</p>}

      <div className="main-grid">
        <div className="col col-left">
          <GovPanel title="Umumiy statistika" icon="📊">
            <ul className="stat-list">
              <li className="stat-row">
                <span className="stat-row__label">Jami yoʻllar</span>
                <strong className="stat-row__value stat-row__value--cyan">
                  {roads.length}
                </strong>
              </li>
            </ul>
          </GovPanel>

          <GovPanel title="Holati boʻyicha" icon="🚦">
            <ul className="stat-list">
              {Object.entries(ROAD_CONDITIONS).map(([key, { label }]) => (
                <li className="stat-row" key={key}>
                  <span className="stat-row__label">{label}</span>
                  <strong
                    className={`stat-row__value stat-row__value--${CONDITION_TONE[key]}`}
                  >
                    {conditionCounts[key]}
                  </strong>
                </li>
              ))}
            </ul>
          </GovPanel>
        </div>

        <div className="col col-center">
          <GovPanel title="Yoʻllar xaritasi" icon="🛣️">
            <div className="entity-map-wrapper">
              <RoadsMap roads={roads} />
            </div>
          </GovPanel>
        </div>

        <div className="col col-right">
          <GovPanel title="Yoʻllar roʻyxati" icon="☷">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Holati</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : roads.length === 0 ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Yoʻllar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    roads.map((road) => {
                      const { color, label } = ROAD_CONDITIONS[road.condition];
                      return (
                        <tr key={road.id}>
                          <td>{road.name}</td>
                          <td>
                            <span className="road-tag" style={{ color, borderColor: color }}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GovPanel>
        </div>
      </div>
    </div>
  );
}

export default Roads;
