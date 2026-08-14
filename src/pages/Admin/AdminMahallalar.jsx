import GeoEntityAdminPage from './GeoEntityAdminPage';
import { MAHALLA_MODULE } from './entityModules';

// /admin/mahallalar - same two-step workflow as AdminRayonlar.jsx: draw +
// name a Mahalla boundary (scoped to a parent Rayon), then click it in the
// right-side list to enter its AVB/Infra statistics (see
// MAHALLA_MODULE.stats in entityModules.js). Existing Rayon boundaries show
// as a pink reference layer on the map for spatial context.
function AdminMahallalar() {
  return (
    <GeoEntityAdminPage
      module={MAHALLA_MODULE}
      subtitle="Mahalla chegarasini koʻpburchak sifatida chizing, soʻng qaysi rayonga tegishli ekanini tanlang."
    />
  );
}

export default AdminMahallalar;
