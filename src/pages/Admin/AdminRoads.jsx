import EntityAdminPage from './EntityAdminPage';
import { ROAD_MODULE } from './entityModules';

// /admin/roads - draws a road as a polyline, then collects its name, rayon
// and surface condition. Persisted to the real Road backend model (see
// src/services/api.js) and reflected immediately on /roads.
function AdminRoads() {
  return (
    <EntityAdminPage
      module={ROAD_MODULE}
      subtitle="Yoʻl yoʻnalishini chiziq (polyline) sifatida chizing."
    />
  );
}

export default AdminRoads;
