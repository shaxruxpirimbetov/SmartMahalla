import { useEffect, useState } from 'react';
import GovPanel from '../../components/GovPanel';
import BusinessesMap from './BusinessesMap';
import { getBusinesses, fetchAllPages } from '../../services/api';
import './Businesses.scss';

// Client view of Admin-drawn businesses (see /admin/businesses) - backed by
// the real Tadbirkorlar backend model, see src/services/api.js.
function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllPages(getBusinesses);
        if (!cancelled) setBusinesses(data);
      } catch {
        if (!cancelled) setError('Bizneslar roʻyxatini yuklashda xatolik yuz berdi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="businesses">
      <header className="businesses__header">
        <div>
          <h1 className="businesses__title">BIZNESLAR</h1>
          <p className="businesses__subtitle">
            Tadbirkorlik obyektlari // {businesses.length} ta
          </p>
        </div>
      </header>

      {error && <p className="businesses__error">{error}</p>}

      <div className="main-grid">
        <div className="col col-left">
          <GovPanel title="Umumiy statistika" icon="📊">
            <ul className="stat-list">
              <li className="stat-row">
                <span className="stat-row__label">Jami bizneslar</span>
                <strong className="stat-row__value stat-row__value--cyan">
                  {businesses.length}
                </strong>
              </li>
            </ul>
          </GovPanel>
        </div>

        <div className="col col-center">
          <GovPanel title="Bizneslar xaritasi" icon="🏪">
            <div className="entity-map-wrapper">
              <BusinessesMap businesses={businesses} />
            </div>
          </GovPanel>
        </div>

        <div className="col col-right">
          <GovPanel title="Bizneslar roʻyxati" icon="☷">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Egasi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : businesses.length === 0 ? (
                    <tr>
                      <td className="data-table__empty" colSpan={2}>
                        Bizneslar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    businesses.map((business) => (
                      <tr key={business.id}>
                        <td>{business.name}</td>
                        <td>{business.owner}</td>
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

export default Businesses;
