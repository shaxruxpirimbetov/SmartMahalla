import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import { loginUser } from '../services/api';
import { setTokens, setRole } from '../utils/auth';
import './Login.scss';

// Single hardcoded account for this build - see the two buttons below.
// Both route through the *same* credentials; only the destination differs.
//
// NOTE - this check happens entirely in the browser: it gates which button
// click is allowed to proceed, nothing more. It is not real access control,
// since anyone can read it straight out of the shipped JS bundle. It's a
// reasonable gate for a prototype/demo; a real deployment should authenticate
// against the backend only (see below) and drop this client-side check.
const HARDCODED_USERNAME = 'admin';
const HARDCODED_PASSWORD = 'admin123';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(role) {
    setError('');

    if (username !== HARDCODED_USERNAME || password !== HARDCODED_PASSWORD) {
      setError("Login yoki parol notoʻgʻri.");
      return;
    }

    setLoading(true);
    try {
      // These exact credentials are also a real account on the backend, so
      // log in for real too - this is what lets Admin actions (creating a
      // Rayon, etc.) attach a real user id server-side instead of only ever
      // saving locally. See utils/auth.js getCurrentUserId().
      const { data } = await loginUser(username, password);
      setTokens({ access: data.access, refresh: data.refresh });
    } catch {
      // Backend unreachable (offline demo, network hiccup, ...) - the
      // hardcoded check above already passed, so let the user in anyway
      // rather than blocking login entirely. There's no local fallback for
      // app data anymore (see src/services/api.js - every entity now talks
      // to the real Django backend directly), so this only gets the user
      // past the login gate itself; any Admin save attempted while the
      // backend is actually down will fail with a real error until it's
      // reachable again.
    }

    setRole(role);
    const fallback = role === 'admin' ? '/admin' : '/dashboard';
    const from = location.state?.from?.pathname;
    navigate(from || fallback, { replace: true });
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__brand-title">SMART MAHALLA</span>
          <span className="login-card__brand-subtitle">Global Big Data Center</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Login
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </label>
          <label>
            Parol
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="login-form__error">{error}</p>}

          <div className="login-form__actions">
            <button
              type="button"
              className="login-form__btn login-form__btn--admin"
              disabled={loading}
              onClick={() => handleLogin('admin')}
            >
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
              Admin sifatida kirish
            </button>
            <button
              type="button"
              className="login-form__btn login-form__btn--public"
              disabled={loading}
              onClick={() => handleLogin('public')}
            >
              <Users size={18} strokeWidth={2} aria-hidden="true" />
              Fuqaro sifatida kirish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
