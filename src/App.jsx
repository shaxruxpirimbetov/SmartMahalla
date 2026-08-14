import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Rayonlar from './pages/Rayonlar/Rayonlar';
import Mahallalar from './pages/Mahallalar/Mahallalar';
import AiPortal from './pages/AiPortal';
import Businesses from './pages/Businesses/Businesses';
import Farmers from './pages/Farmers/Farmers';
import Roads from './pages/Roads/Roads';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminRayonlar from './pages/Admin/AdminRayonlar';
import AdminMahallalar from './pages/Admin/AdminMahallalar';
import AdminBusinesses from './pages/Admin/AdminBusinesses';
import AdminFarmers from './pages/Admin/AdminFarmers';
import AdminRoads from './pages/Admin/AdminRoads';
import AdminAiPortal from './pages/Admin/AdminAiPortal';
import './styles/layout.scss';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rayonlar" element={<Rayonlar />} />
          <Route path="/mahallalar" element={<Mahallalar />} />
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/roads" element={<Roads />} />
          <Route path="/ai-portal" element={<AiPortal />} />

          {/* "Login as Public" sessions are authenticated but not admin -
              requireAdmin bounces them to /dashboard instead of letting
              them reach any /admin/* route. */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="rayonlar" element={<AdminRayonlar />} />
              <Route path="mahallalar" element={<AdminMahallalar />} />
              <Route path="businesses" element={<AdminBusinesses />} />
              <Route path="farmers" element={<AdminFarmers />} />
              <Route path="roads" element={<AdminRoads />} />
              <Route path="ai-portal" element={<AdminAiPortal />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
