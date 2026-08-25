import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  logout,
} from '../utils/auth';
import { dataUrlToBlob } from '../utils/imageCompress';

export const BASE_URL = 'https://sdatabase.pythonanywhere.com/api/';
// Local dev: comment the line above and uncomment this one, then run
// `python manage.py runserver` in SmartMahalla/ to test against it instead.
// export const BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue of requests waiting on an in-flight token refresh, so concurrent
// 401s only trigger a single refresh call.
let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

function redirectToLogin() {
  logout();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config: originalRequest } = error;

    if (!response) {
      return Promise.reject(error);
    }

    if (response.status === 429) {
      console.warn('[api] Rate limit exceeded (429). Slow down requests.');
      return Promise.reject(error);
    }

    if (response.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      // No refresh token, or the failing request was the refresh call itself.
      if (!refreshToken || originalRequest.url?.includes('/refresh/')) {
        // Only force a hard redirect if there *was* a real JWT session to
        // lose (i.e. this looks like an expired/invalid session). A
        // role-only local session (Login.jsx's offline fallback - hardcoded
        // credentials matched but the real backend was unreachable at login
        // time, so no token was ever issued) never had one, and every
        // backend call it makes is expected to 401.
        if (getAccessToken()) {
          redirectToLogin();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}refresh/`, {
          refresh: refreshToken,
        });
        setTokens({ access: data.access });
        resolvePendingQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---- Auth ----
export const loginUser = (username, password) =>
  api.post('token/', { username, password });

export const refreshAccessToken = (refresh) =>
  api.post('refresh/', { refresh });

// ---- User ----
export const getUsers = (params) => api.get('user/', { params });
export const getUser = (id) => api.get(`user/${id}/`);
export const createUser = (data) => api.post('user/', data);
export const updateUser = (id, data) => api.put(`user/${id}/`, data);
export const patchUser = (id, data) => api.patch(`user/${id}/`, data);
export const deleteUser = (id) => api.delete(`user/${id}/`);

// ---- Rayon ----
export const getRayons = (params) => api.get('rayon/', { params });
export const getRayon = (id) => api.get(`rayon/${id}/`);
export const createRayon = (data) => api.post('rayon/', data);
export const updateRayon = (id, data) => api.put(`rayon/${id}/`, data);
export const patchRayon = (id, data) => api.patch(`rayon/${id}/`, data);
export const deleteRayon = (id) => api.delete(`rayon/${id}/`);

// ---- Mahalla ----
// params: { rayon }
export const getMahallas = (params) => api.get('mahalla/', { params });
export const createMahalla = (data) => api.post('mahalla/', data);
// PATCH only sends { name, rayon } - MahallaDetailAPIView's update
// serializer never accepts the drawn `plot` geometry back - see
// apps/mahalla/serializers.py MahallaUpdateSerializer.
export const updateMahalla = (id, data) => api.patch(`mahalla/${id}/`, data);
export const deleteMahalla = (id) => api.delete(`mahalla/${id}/`);

// ---- Aholi va Bandlik (AVB) ----
// params: { mahalla } or { rayon } - see apps/mahalla/models.py
// AholiVaBandlik: exactly one of the two FKs is set per row (a Mahalla-level
// snapshot, or - when a Rayon has no per-Mahalla breakdown yet - a
// Rayon-level one; see RAYON_MODULE.stats in entityModules.js). Every field
// besides mahalla/rayon defaults to 0 server-side, so a partial payload (only
// the fields the Admin stats form actually collects) is valid.
export const getAholiVaBandlik = (params) => api.get('mahalla/avb/', { params });
export const createAholiVaBandlik = (data) => api.post('mahalla/avb/', data);

// ---- Infratuzilma (Infra) ----
// Same mahalla/rayon contract as AVB above - see apps/mahalla/models.py
// InfratuzulmaTaxlili.
export const getInfratuzilma = (params) => api.get('mahalla/infra/', { params });
export const createInfratuzilma = (data) => api.post('mahalla/infra/', data);

// ---- multipart helper (Tadbirkorlar `image` / Farmer `photo`) ----
// Both are real Django ImageFields now (apps/mahalla/models.py,
// apps/land/models.py), which only DRF's MultiPartParser can deserialize -
// see SmartMahalla/settings.py DEFAULT_PARSER_CLASSES. FieldsFormModal keeps
// a picked photo as a base64 data URL the whole time it's being edited (see
// compressImageFile in utils/imageCompress.js), so `fileFields` names which
// keys need converting back to a real Blob right before the request; every
// other value - including GeoJSON objects like `location`/`plot` - is
// JSON-stringified into its own form field (the backend's FlexibleJSONField
// - see apps/mahalla/serializers.py / apps/land/serializers.py - parses
// those back out on the way in). axios detects a FormData body and sets the
// multipart Content-Type/boundary itself, so nothing else has to change
// about how these are called.
function toFormData(data, fileFields = []) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) return;
    if (fileFields.includes(key)) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        formData.append(key, dataUrlToBlob(value), `${key}.jpg`);
      }
      // else: no new photo was picked (e.g. editing without replacing the
      // image) - omit the key entirely so DRF keeps the existing file.
      return;
    }
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });
  return formData;
}

// ---- Business (Tadbirkorlar) ----
// params: { mahalla }. Backend model: apps/mahalla/models.py Tadbirkorlar.
// TadbirkorlarDetailAPIView is a RetrieveUpdateDestroyAPIView, so PATCH/DELETE
// both work - see apps/mahalla/views.py.
export const getBusinesses = (params) => api.get('mahalla/tadbirkorlar/', { params });
export const createBusiness = (data) =>
  api.post('mahalla/tadbirkorlar/', toFormData(data, ['image']));
// PATCH (not PUT) so the edit form - which only collects `module.fields`,
// never the `location` geometry - can send a partial payload without the
// backend rejecting it for missing required fields.
export const updateBusiness = (id, data) =>
  api.patch(`mahalla/tadbirkorlar/${id}/`, toFormData(data, ['image']));
export const deleteBusiness = (id) => api.delete(`mahalla/tadbirkorlar/${id}/`);

// ---- Farmer ----
// params: { mahalla }. Backend model: apps/land/models.py Farmer.
// FarmerDetailAPIView is a RetrieveUpdateDestroyAPIView - see apps/land/views.py.
export const getFarmers = (params) => api.get('land/farmer/', { params });
export const createFarmer = (data) => api.post('land/farmer/', toFormData(data, ['photo']));
export const updateFarmer = (id, data) =>
  api.patch(`land/farmer/${id}/`, toFormData(data, ['photo']));
export const deleteFarmer = (id) => api.delete(`land/farmer/${id}/`);

// ---- Road ----
// params: { rayon }. Backend model: apps/land/models.py Road - no file
// field, so this stays a plain JSON POST/PATCH.
// RoadDetailAPIView is a RetrieveUpdateDestroyAPIView - see apps/land/views.py.
export const getRoads = (params) => api.get('land/road/', { params });
export const createRoad = (data) => api.post('land/road/', data);
export const updateRoad = (id, data) => api.patch(`land/road/${id}/`, data);
export const deleteRoad = (id) => api.delete(`land/road/${id}/`);

// ---- AI Analysis ----
// SmartMahalla/apps/ai/views.py AnalysAPIView - the only AI endpoint this
// backend exposes. On the server it runs every AholiVaBandlik/
// InfratuzulmaTaxlili record through Gemini and returns:
//   {
//     "data": {
//       "good_businesses": string[],
//       "missing_businesses": string[],
//       "urgent_city_problems": string[],
//       "strong_sides": string[]
//     },
//     "images": string[]   // MEDIA_URL-relative paths, e.g. "media/img.png"
//   }
// or, on failure server-side (Gemini quota/network/etc.), a non-2xx
// response shaped `{ "error": "..." }`.
export const getAIAnalysis = (params) => api.get('ai/', { params });

// AiPortal.jsx's "Maslahat olish" button calls this specific name - same
// call as getAIAnalysis above, no extra params needed for that use.
export const getAiRecommendation = () => getAIAnalysis();

// `images` above, and Tadbirkorlar.image/Farmer.photo, all come back as
// paths relative to the Django site root's MEDIA_URL ("media/" - see
// SmartMahalla/SmartMahalla/settings.py), not under BASE_URL's own "/api/"
// prefix - so they can't be used as-is. Resolves one against the API's
// actual origin.
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${new URL(BASE_URL).origin}/${String(path).replace(/^\/+/, '')}`;
}

// Paginated list endpoints cap out at 20 results per page (`{ count, next,
// previous, results }`). This walks `next` until exhausted so callers get
// the full collection instead of just the first page.
const MAX_PAGES = 50;

export async function fetchAllPages(listFn, params) {
  const { data: firstPage } = await listFn(params);
  let results = firstPage.results ?? [];
  let nextUrl = firstPage.next;
  let pageCount = 1;

  while (nextUrl && pageCount < MAX_PAGES) {
    const { data } = await api.get(nextUrl);
    results = results.concat(data.results ?? []);
    nextUrl = data.next;
    pageCount += 1;
  }

  return results;
}

// Same as fetchAllPages, but never throws - it resolves to an empty list
// plus the error instead. Use this for endpoints that may be broken
// server-side so one bad endpoint doesn't take down a page that combines
// several fetches.
export async function fetchAllPagesSafe(listFn, params) {
  try {
    const data = await fetchAllPages(listFn, params);
    return { data, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

// ---- Admin "clear everything" ----
// Wipes every domain entity so the Admin can start entering data again from
// a clean slate (AdminOverview.jsx's "Xavfli zona" button). Deletes leaf
// entities with a real DELETE endpoint first (Business/Farmer/Road), then
// Mahalla, then Rayon - AVB/Infra have no delete endpoint of their own (see
// apps/mahalla/views.py - they're append-only logs), so they're removed
// indirectly: deleting their parent Mahalla/Rayon cascades onto them at the
// DB level (on_delete=CASCADE - see apps/mahalla/models.py). Ordering leaf
// entities before Mahalla/Rayon means even a partial run leaves less behind.
async function deleteAllOf(listFn, deleteFn) {
  const items = await fetchAllPages(listFn);
  const results = await Promise.allSettled(items.map((item) => deleteFn(item.id)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { total: items.length, failed };
}

export async function clearAllData() {
  return {
    business: await deleteAllOf(getBusinesses, deleteBusiness),
    farmer: await deleteAllOf(getFarmers, deleteFarmer),
    road: await deleteAllOf(getRoads, deleteRoad),
    mahalla: await deleteAllOf(getMahallas, deleteMahalla),
    rayon: await deleteAllOf(getRayons, deleteRayon),
  };
}

export default api;
