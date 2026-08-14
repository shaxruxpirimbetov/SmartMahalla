import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GovPanel from '../../components/GovPanel';
import RayonMap from './RayonMap';
import { getRayons, getMahallas, fetchAllPages } from '../../services/api';
import './Rayonlar.scss';

function Rayonlar() {
  const [rayons, setRayons] = useState([]);
  const [mahallas, setMahallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [rData, mData] = await Promise.all([
          fetchAllPages(getRayons),
          fetchAllPages(getMahallas),
        ]);
        if (!cancelled) {
          setRayons(rData);
          setMahallas(mData);
        }
      } catch {
        if (!cancelled) {
          setError('Rayonlar roʻyxatini yuklashda xatolik yuz berdi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mahallaCountByRayon = useMemo(() => {
    const counts = {};
    mahallas.forEach((m) => {
      counts[m.rayon] = (counts[m.rayon] || 0) + 1;
    });
    return counts;
  }, [mahallas]);

  function goToMahallalar(rayonId) {
    navigate(`/mahallalar?rayon=${rayonId}`);
  }

  return (
    <div className="rayonlar">
      <header className="rayonlar__header">
        <div>
          <h1 className="rayonlar__title">RAYONLAR</h1>
          <p className="rayonlar__subtitle">
            Hududiy boshqaruv // {rayons.length} ta rayon
          </p>
        </div>
      </header>

      {error && <p className="rayonlar__error">{error}</p>}

      <div className="rayonlar__grid">
        <GovPanel title="Xarita" icon="◈" className="rayonlar__map-panel">
          <div className="entity-map-wrapper">
            <RayonMap rayons={rayons} onSelectRayon={goToMahallalar} />
          </div>
        </GovPanel>

        <GovPanel title="Rayonlar roʻyxati" icon="☷">
          {loading ? (
            <div className="rayon-cards">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rayon-card rayon-card--skeleton" />
              ))}
            </div>
          ) : rayons.length === 0 ? (
            <p className="panel-notice">Rayonlar topilmadi.</p>
          ) : (
            <div className="rayon-cards">
              {rayons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="rayon-card"
                  onClick={() => goToMahallalar(r.id)}
                >
                  <div className="rayon-card__name">{r.name}</div>
                  <div className="rayon-card__meta">
                    <span>{r.region}</span>
                    <span
                      className={`rayon-card__badge ${
                        r.is_active ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      {r.is_active ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <div className="rayon-card__count">
                    {mahallaCountByRayon[r.id] || 0} ta mahalla
                  </div>
                </button>
              ))}
            </div>
          )}
        </GovPanel>
      </div>
    </div>
  );
}

export default Rayonlar;
