import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import GovPanel from '../../components/GovPanel';
import {
  getRayons,
  getMahallas,
  getBusinesses,
  getFarmers,
  getRoads,
  fetchAllPagesSafe,
  clearAllData,
} from '../../services/api';
import './AdminShared.scss';

const OVERVIEW_CARDS = [
  { key: 'rayon', to: '/admin/rayonlar', icon: '🗾', label: 'Rayonlar', list: getRayons },
  { key: 'mahalla', to: '/admin/mahallalar', icon: '🏘️', label: 'Mahallalar', list: getMahallas },
  { key: 'business', to: '/admin/businesses', icon: '🏪', label: 'Bizneslar', list: getBusinesses },
  { key: 'farmer', to: '/admin/farmers', icon: '🚜', label: 'Fermerlar', list: getFarmers },
  { key: 'road', to: '/admin/roads', icon: '🛣️', label: "Yoʻllar", list: getRoads },
];

// /admin - the dashboard landing page. Just counts + links into each
// dedicated drawing page; the actual map/form mechanics live there.
function AdminOverview() {
  const [counts, setCounts] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  async function loadCounts() {
    const entries = await Promise.all(
      OVERVIEW_CARDS.map(async ({ key, list }) => {
        const { data } = await fetchAllPagesSafe(list);
        return [key, data.length];
      })
    );
    setCounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        OVERVIEW_CARDS.map(async ({ key, list }) => {
          const { data } = await fetchAllPagesSafe(list);
          return [key, data.length];
        })
      );
      if (!cancelled) setCounts(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // "Hamma maʼlumotlarni tozalash" - wipes every Rayon/Mahalla/statistika/
  // Biznes/Fermer/Yoʻl row on the real backend (see clearAllData in
  // api.js), then reloads the counts above so this page and every other
  // Admin page immediately reflect the clean slate and are ready to accept
  // new data again.
  async function handleClearAllData() {
    const confirmed = window.confirm(
      'DIQQAT: bu Rayon, Mahalla, statistika (AVB/Infra), Bizneslar, Fermerlar va Yoʻllarni ' +
        'REAL BACKEND SERVERIDAN butunlay oʻchiradi. Bu amalni qaytarib boʻlmaydi. Davom etilsinmi?'
    );
    if (!confirmed) return;

    setClearing(true);
    setClearMsg('');
    try {
      const result = await clearAllData();
      const failedTotal = Object.values(result).reduce((sum, r) => sum + r.failed, 0);
      setClearMsg(
        failedTotal > 0
          ? `Tozalandi, lekin ${failedTotal} ta yozuvni oʻchirib boʻlmadi (tarmoq xatosi boʻlishi mumkin) - qayta urinib koʻring.`
          : 'Hamma maʼlumotlar muvaffaqiyatli tozalandi. Endi yangi maʼlumot kiritishingiz mumkin.'
      );
      await loadCounts();
    } catch {
      setClearMsg('Tozalashda xatolik yuz berdi - backend bilan ulanishni tekshiring.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="admin-page">
      <GovPanel title="Umumiy koʻrinish" icon="☷">
        <div className="admin-overview-grid">
          {OVERVIEW_CARDS.map(({ key, to, icon, label }) => (
            <NavLink key={key} to={to} className="admin-overview-card">
              <span className="admin-overview-card__icon" aria-hidden="true">
                {icon}
              </span>
              <span className="admin-overview-card__label">{label}</span>
              <strong className="admin-overview-card__count">{counts ? counts[key] : '…'}</strong>
            </NavLink>
          ))}
        </div>
      </GovPanel>

      <GovPanel title="Qoʻllanma" icon="ℹ️">
        <p className="panel-notice">
          Har bir boʻlim xaritada tegishli shaklni (nuqta, koʻpburchak yoki chiziq) chizish va
          tafsilotlarni kiritish orqali yangi obyekt qoʻshish imkonini beradi. Barcha maʼlumotlar
          (Rayon, Mahalla, statistika, Bizneslar, Fermerlar, Yoʻllar) toʻgʻridan-toʻgʻri real
          backend serveriga saqlanadi va istalgan qurilmadan kirgan mijozga darhol koʻrinadi.
        </p>
      </GovPanel>

      <GovPanel title="Xavfli zona" icon="⚠️" className="admin-danger-panel">
        <p className="panel-notice">
          Rayon, Mahalla, statistika (AVB/Infra), Bizneslar, Fermerlar va Yoʻllarni real backend
          serveridan butunlay oʻchiradi - login sessiyangizga tegmaydi, oʻchirilgach yangidan
          maʼlumot kirita olasiz. Bu amalni qaytarib boʻlmaydi.
        </p>
        {clearMsg && <p className="panel-notice admin-danger-panel__msg">{clearMsg}</p>}
        <button
          type="button"
          className="admin-danger-btn"
          onClick={handleClearAllData}
          disabled={clearing}
        >
          <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
          {clearing ? 'Tozalanmoqda...' : 'Hamma maʼlumotlarni tozalash'}
        </button>
      </GovPanel>
    </div>
  );
}

export default AdminOverview;
