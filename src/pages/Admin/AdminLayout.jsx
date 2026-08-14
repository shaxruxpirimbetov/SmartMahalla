import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  MapPin,
  Store,
  Tractor,
  Route as RouteIcon,
  Bot,
  LogOut,
} from 'lucide-react';
import { logout } from '../../utils/auth';
import './AdminLayout.scss';

const ADMIN_NAV = [
  { to: '/admin', label: 'Umumiy koʻrinish', icon: LayoutDashboard, end: true },
  { to: '/admin/rayonlar', label: 'Rayonlar', icon: Map },
  { to: '/admin/mahallalar', label: 'Mahallalar', icon: MapPin },
  { to: '/admin/businesses', label: 'Bizneslar', icon: Store },
  { to: '/admin/farmers', label: 'Fermerlar', icon: Tractor },
  { to: '/admin/roads', label: "Yoʻllar", icon: RouteIcon },
  { to: '/admin/ai-portal', label: 'AI Portal', icon: Bot },
];

// Admin-specific chrome (header + sub-navigation), nested inside the app's
// global Layout (see App.jsx) so the outer sidebar/logout stay in place.
// Each item below routes to its own dedicated page via <Outlet/>.
function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <div className="admin-layout__header-row">
          <div>
            <h1 className="admin-layout__title">ADMIN PANEL</h1>
            <p className="admin-layout__subtitle">Xarita obyektlarini chizish va boshqarish</p>
          </div>
          <button
            type="button"
            className="admin-layout__logout"
            onClick={handleLogout}
            title="Chiqish"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            Chiqish
          </button>
        </div>
      </header>

      <nav className="admin-layout__nav" aria-label="Admin boʻlimlari">
        {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `admin-layout__link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-layout__content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
