import GeoEntityAdminPage from './GeoEntityAdminPage';
import { RAYON_MODULE } from './entityModules';

// /admin/rayonlar - two-step workflow: draw a Rayon boundary + name it
// (left map), then click it in the right-side list to fill in its
// population/economy statistics (see RAYON_MODULE.stats in
// entityModules.js). Template for any other geo-entity admin page - see
// AdminMahallalar.jsx for the same pattern applied to Mahalla.
function AdminRayonlar() {
  return (
    <GeoEntityAdminPage
      module={RAYON_MODULE}
      subtitle="Rayon chegarasini koʻpburchak sifatida chizing."
    />
  );
}

export default AdminRayonlar;
