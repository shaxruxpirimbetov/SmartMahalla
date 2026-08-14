import EntityAdminPage from './EntityAdminPage';
import { BUSINESS_MODULE } from './entityModules';

// /admin/businesses - marks a business as a single point (marker) on the
// map, then collects its name/owner/mahalla/photo/description. Saved to the
// real Tadbirkorlar backend model (see src/services/api.js) and appear
// immediately on the client-facing /businesses map.
function AdminBusinesses() {
  return (
    <EntityAdminPage
      module={BUSINESS_MODULE}
      subtitle="Biznes joylashgan nuqtani markyer bilan belgilang."
    />
  );
}

export default AdminBusinesses;
