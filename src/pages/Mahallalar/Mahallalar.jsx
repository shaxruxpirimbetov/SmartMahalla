import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GovPanel from '../../components/GovPanel';
import MahallaMap from './MahallaMap';
import {
  getMahallas,
  getRayons,
  getAholiVaBandlik,
  fetchAllPages,
} from '../../services/api';
import './Mahallalar.scss';

function Mahallalar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rayonFilter = searchParams.get('rayon') || '';

  const [mahallas, setMahallas] = useState([]);
  const [rayons, setRayons] = useState([]);
  const [avbData, setAvbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [mData, rData, aData] = await Promise.all([
          fetchAllPages(getMahallas, rayonFilter ? { rayon: rayonFilter } : undefined),
          fetchAllPages(getRayons),
          fetchAllPages(getAholiVaBandlik),
        ]);
        if (!cancelled) {
          setMahallas(mData);
          setRayons(rData);
          setAvbData(aData);
        }
      } catch {
        if (!cancelled) {
          setError('Mahallalar roʻyxatini yuklashda xatolik yuz berdi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [rayonFilter]);

  const rayonById = useMemo(() => {
    const map = {};
    rayons.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [rayons]);

  const avbByMahalla = useMemo(() => {
    const map = {};
    avbData.forEach((a) => {
      map[a.mahalla] = a;
    });
    return map;
  }, [avbData]);

  const rows = useMemo(
    () =>
      mahallas.map((m) => {
        const avb = avbByMahalla[m.id];
        return {
          id: m.id,
          name: m.name,
          rayonName: rayonById[m.rayon]?.name ?? '—',
          aholi: avb ? Number(avb.aholi_soni) || 0 : null,
          bandAholi: avb ? Number(avb.band_aholi) || 0 : null,
          poverty: avb ? Number(avb.kambagallik_darajasi) || 0 : null,
        };
      }),
    [mahallas, rayonById, avbByMahalla]
  );

  function handleRayonChange(e) {
    const value = e.target.value;
    if (value) setSearchParams({ rayon: value });
    else setSearchParams({});
  }

  return (
    <div className="mahallalar">
      <header className="mahallalar__header">
        <div>
          <h1 className="mahallalar__title">MAHALLALAR</h1>
          <p className="mahallalar__subtitle">
            {rayonFilter
              ? `${rayonById[rayonFilter]?.name ?? 'Rayon'} boʻyicha`
              : 'Barcha rayonlar'}{' '}
            // {mahallas.length} ta mahalla
          </p>
        </div>
        <select
          className="rayon-select"
          value={rayonFilter}
          onChange={handleRayonChange}
        >
          <option value="">Barcha rayonlar</option>
          {rayons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="mahallalar__error">{error}</p>}

      <div className="mahallalar__grid">
        <GovPanel title="Xarita" icon="◈" className="mahallalar__map-panel">
          <div className="entity-map-wrapper">
            <MahallaMap mahallas={mahallas} />
          </div>
        </GovPanel>

        <GovPanel title="Mahallalar roʻyxati" icon="☷">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rayon</th>
                  <th>Mahalla</th>
                  <th>Aholi</th>
                  <th>Band aholi</th>
                  <th>Kambagʻallik %</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="data-table__empty">
                      Mahalla topilmadi.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.rayonName}</td>
                      <td>{row.name}</td>
                      <td>{row.aholi !== null ? row.aholi.toLocaleString() : '—'}</td>
                      <td>
                        {row.bandAholi !== null ? row.bandAholi.toLocaleString() : '—'}
                      </td>
                      <td>{row.poverty !== null ? `${row.poverty.toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GovPanel>
      </div>
    </div>
  );
}

export default Mahallalar;
