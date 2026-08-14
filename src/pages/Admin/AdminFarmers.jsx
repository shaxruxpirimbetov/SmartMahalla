import EntityAdminPage from './EntityAdminPage';
import { FARMER_MODULE } from './entityModules';

// /admin/farmers - draws a farmer's plot as a polygon, then collects
// name/crop/mahalla/photo/description. Persisted to the real Farmer backend
// model (see src/services/api.js) and reflected immediately on /farmers.
function AdminFarmers() {
  return (
    <EntityAdminPage
      module={FARMER_MODULE}
      subtitle="Fermer xoʻjaligi maydonini koʻpburchak sifatida chizing."
    />
  );
}

export default AdminFarmers;
