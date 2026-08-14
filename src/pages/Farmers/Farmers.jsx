import { useEffect, useMemo, useState } from 'react';
import GovPanel from '../../components/GovPanel';
import FarmersMap from './FarmersMap';
import { getFarmers, fetchAllPages } from '../../services/api';
import './Farmers.scss';

// Client view of Admin-drawn farmers (see /admin/farmers) - backed by the
// real Farmer backend model, see src/services/api.js.
function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllPages(getFarmers);
        if (!cancelled) setFarmers(data);
      } catch {
        if (!cancelled) setError('Fermerlar roʻyxatini yuklashda xatolik yuz berdi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cropCounts = useMemo(() => {
    const counts = {};
    farmers.forEach((farm) => {
      counts[farm.crop] = (counts[farm.crop] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [farmers]);

  return (
    <div className="farmers">
      <header className="farmers__header">
        <div>
          <h1 className="farmers__title">FERMERLAR</h1>
          <p className="farmers__subtitle">
            Qishloq xoʻjaligi obyektlari // {farmers.length} ta xoʻjalik
          </p>
        </div>
      </header>

      {error && <p className="farmers__error">{error}</p>}

      <div className="main-grid">
        <div className="col col-left">
          <GovPanel title="Umumiy statistika" icon="📊">
            <ul className="stat-list">
              <li className="stat-row">
                <span className="stat-row__label">Jami xoʻjaliklar</span>
                <strong className="stat-row__value stat-row__value--cyan">
                  {farmers.length}
                </strong>
              </li>
            </ul>
          </GovPanel>

          <GovPanel title="Ekin turlari boʻyicha" icon="🌾">
            <ul className="stat-list">
              {cropCounts.map(([crop, count]) => (
                <li className="stat-row" key={crop}>
                  <span className="stat-row__label">{crop}</span>
                  <strong className="stat-row__value stat-row__value--cyan">
                    {count}
                  </strong>
                </li>
              ))}
            </ul>
          </GovPanel>
        </div>

        <div className="col col-center">
          <GovPanel title="Fermer xoʻjaliklari xaritasi" icon="🚜">
            <div className="entity-map-wrapper">
              <FarmersMap farmers={farmers} />
            </div>
          </GovPanel>
        </div>

        <div className="col col-right">
          <GovPanel title="Fermer xoʻjaliklari roʻyxati" icon="☷">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Ekin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : farmers.length === 0 ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Fermerlar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    farmers.map((farm) => (
                      <tr key={farm.id}>
                        <td>{farm.name}</td>
                        <td>{farm.crop}</td>
                      </tr>
                    ))
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

export default Farmers;
