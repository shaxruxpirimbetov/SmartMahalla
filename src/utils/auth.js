const ACCESS_TOKEN_KEY = 'sm_access_token';
const REFRESH_TOKEN_KEY = 'sm_refresh_token';
const ROLE_KEY = 'sm_role';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Which button the user logged in with on Login.jsx ('admin' | 'public') -
// separate from the JWT tokens above because a login can succeed locally
// (hardcoded credential match) even when the real backend is unreachable,
// in which case there's no token to derive a role from. ProtectedRoute uses
// this to gate the /admin/* route tree; Layout could use it later to hide
// admin-only chrome from a 'public' session.
export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role);
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY);
}

// True once Login.jsx has recorded a session - either a real JWT (normal
// path) or, failing that, a role-only local session (see Login.jsx: the
// hardcoded admin/admin123 check already gated entry, so a network failure
// reaching the real backend at that point degrades to local-only instead of
// blocking login entirely - though every app-data write still needs the
// real backend, see src/services/api.js).
export function isAuthenticated() {
  return Boolean(getAccessToken()) || Boolean(getRole());
}

// Clears both the JWT session and the role flag - use this instead of
// clearTokens() alone anywhere the user is being fully logged out (Layout's
// logout button, a 401 that can't be refreshed).
export function logout() {
  clearTokens();
  clearRole();
}

// Decodes the access token's payload to read the SimpleJWT default
// `user_id` claim (see SmartMahalla/settings.py SIMPLE_JWT - USER_ID_CLAIM
// is left at its default). Needed because Rayon.creator is a required FK
// with no server-side default, so creating a Rayon from the client has to
// supply it explicitly.
export function getCurrentUserId() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(base64));
    return json.user_id ?? null;
  } catch {
    return null;
  }
}
