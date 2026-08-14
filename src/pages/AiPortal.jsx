import { useState } from 'react';
import { Sparkles, Loader2, ImageOff } from 'lucide-react';
import GovPanel from '../components/GovPanel';
import { getAiRecommendation, resolveMediaUrl } from '../services/api';
import './AiPortal.scss';

const BUTTON_LABEL = {
  idle: 'Maslahat olish',
  loading: 'Tahlil qilinmoqda...',
  ready: 'Yana tavsiya olish',
  error: 'Qayta urinib koʻrish',
};

// Backend shape (SmartMahalla/apps/ai/views.py AnalysAPIView): `data.data`
// is a Gemini-generated breakdown across exactly these 4 keys, each a
// string array. Order here is the display order - positives first.
const SECTIONS = [
  { key: 'strong_sides', label: 'Kuchli tomonlar' },
  { key: 'good_businesses', label: 'Yaxshi rivojlangan bizneslar' },
  { key: 'missing_businesses', label: 'Yetishmayotgan bizneslar' },
  { key: 'urgent_city_problems', label: 'Shoshilinch muammolar' },
];

function ImageSkeleton() {
  return <div className="ai-portal__image-skeleton" aria-hidden="true" />;
}

function TextSkeleton() {
  return (
    <div className="ai-portal__text-skeleton" aria-hidden="true">
      <span className="ai-portal__skeleton-bar" style={{ width: '35%' }} />
      <span className="ai-portal__skeleton-bar" style={{ width: '95%' }} />
      <span className="ai-portal__skeleton-bar" style={{ width: '88%' }} />
      <span className="ai-portal__skeleton-bar" style={{ width: '92%' }} />
      <span className="ai-portal__skeleton-bar" style={{ width: '60%' }} />
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="ai-portal__empty">
      <span className="ai-portal__empty-icon" aria-hidden="true">
        {icon}
      </span>
      <p>{text}</p>
    </div>
  );
}

// /ai-portal - click the button, get exactly one image + one text, both
// picked at random from the live backend's real Gemini-generated response
// (an illustrative image pool + a 4-category analysis - see SECTIONS
// above). Backed 100% by getAiRecommendation() (src/services/api.js) - no
// mock data, no client-side generation.
function AiPortal() {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleGetAdvice() {
    setStatus('loading');
    try {
      const { data } = await getAiRecommendation();

      // One random image out of the handful the backend returns.
      const images = (data.images ?? []).map(resolveMediaUrl).filter(Boolean);
      const imageUrl = images.length ? images[Math.floor(Math.random() * images.length)] : null;

      // One random line out of *all* of the analysis's 4 categories pooled
      // together - not the whole structured breakdown. Keeps the card to
      // exactly one image + one text, both freshly randomized per click.
      const analysis = data.data ?? {};
      const pool = SECTIONS.flatMap((s) =>
        (Array.isArray(analysis[s.key]) ? analysis[s.key] : []).map((text) => ({
          category: s.label,
          text,
        }))
      );
      const advice = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

      setResult({ imageUrl, advice });
      setStatus('ready');
    } catch (err) {
      // The backend returns `{ "error": "..." }` on a Gemini/server-side
      // failure (see AnalysAPIView) - surface that specific message when
      // present instead of a generic one.
      setErrorMessage(err?.response?.data?.error || 'Tavsiya olishda xatolik yuz berdi.');
      setResult(null);
      setStatus('error');
    }
  }

  return (
    <div className="ai-portal">
      <header className="ai-portal__header">
        <div>
          <h1 className="ai-portal__title">AI PORTAL</h1>
          <p className="ai-portal__subtitle">
            Sunʼiy intellekt asosida hudud boʻyicha tavsiyalar
          </p>
        </div>

        <button
          type="button"
          className="ai-portal__cta"
          onClick={handleGetAdvice}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <Loader2 size={18} className="ai-portal__spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {BUTTON_LABEL[status]}
        </button>
      </header>

      {status === 'error' && <p className="ai-portal__error">{errorMessage}</p>}

      <div className="ai-portal__grid">
        <GovPanel title="Tavsiya rasmi" icon="▣" className="ai-portal__image-panel">
          {status === 'loading' && <ImageSkeleton />}
          {status === 'ready' && result?.imageUrl && (
            <figure className="ai-portal__image-frame">
              <img src={result.imageUrl} alt="AI tavsiyasi" className="ai-portal__image" />
            </figure>
          )}
          {status === 'ready' && !result?.imageUrl && (
            <EmptyState
              icon={<ImageOff size={28} strokeWidth={1.5} />}
              text="Backend hozircha rasm qaytarmadi."
            />
          )}
          {status === 'idle' && <EmptyState icon="▣" text="Rasm shu yerda koʻrinadi." />}
          {status === 'error' && (
            <EmptyState
              icon={<ImageOff size={28} strokeWidth={1.5} />}
              text="Rasm yuklanmadi."
            />
          )}
        </GovPanel>

        <GovPanel title="AI tahlili" icon="✦" className="ai-portal__text-panel">
          {status === 'loading' && <TextSkeleton />}
          {status === 'ready' && result?.advice && (
            <div className="ai-portal__advice">
              <span className="ai-portal__advice-tag">{result.advice.category}</span>
              <p className="ai-portal__advice-text">{result.advice.text}</p>
              <p className="ai-portal__advice-footer">
                <Sparkles size={13} /> Sunʼiy intellekt tomonidan generatsiya qilindi
              </p>
            </div>
          )}
          {status === 'ready' && !result?.advice && (
            <EmptyState icon="✦" text="Backend hozircha tahlil qaytarmadi." />
          )}
          {status === 'idle' && (
            <EmptyState
              icon="✦"
              text={'Tavsiya matni shu yerda chiqadi. Yuqoridagi "Maslahat olish" tugmasini bosing.'}
            />
          )}
          {status === 'error' && <EmptyState icon="✦" text="Tahlil yuklanmadi." />}
        </GovPanel>
      </div>
    </div>
  );
}

export default AiPortal;
