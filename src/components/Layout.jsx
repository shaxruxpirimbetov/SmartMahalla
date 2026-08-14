import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  MapPin,
  Store,
  Tractor,
  Route as RouteIcon,
  Bot,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { logout, getRole } from '../utils/auth';

// Core overarching pages - live in the top header now, not the sidebar.
const TOP_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rayonlar', icon: Map, label: 'Rayonlar' },
  { to: '/mahallalar', icon: MapPin, label: 'Mahallalar' },
];

// Specialized operational modules - stay in the icon rail on the left.
const MODULE_LINKS = [
  { to: '/businesses', icon: Store, label: 'Bizneslar' },
  { to: '/farmers', icon: Tractor, label: 'Fermerlar' },
  { to: '/roads', icon: RouteIcon, label: "Yoʻllar" },
  { to: '/ai-portal', icon: Bot, label: 'AI Portal' },
];

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className="app-sidebar__link" title={label}>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
    </NavLink>
  );
}

function TopbarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `app-topbar__link ${isActive ? 'is-active' : ''}`}
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link to="/dashboard" className="app-sidebar__logo" title="Smart Mahalla - Dashboardga oʻtish">
          SM
        </Link>

        <nav className="app-sidebar__nav">
          {MODULE_LINKS.map((link) => (
            <SidebarLink key={link.to} {...link} />
          ))}
        </nav>

        <button
          type="button"
          className="app-sidebar__logout"
          onClick={handleLogout}
          title="Chiqish"
        >
          <LogOut size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div className="app-topbar__brand">
            <span className="app-topbar__brand-title">SMART MAHALLA</span>
            <span className="app-topbar__brand-subtitle">Global Big Data Center</span>
          </div>

          <nav className="app-topbar__nav" aria-label="Asosiy sahifalar">
            {TOP_LINKS.map((link) => (
              <TopbarLink key={link.to} {...link} />
            ))}
          </nav>

          {getRole() === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `app-topbar__admin ${isActive ? 'is-active' : ''}`}
              title="Admin Portal"
            >
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
              Admin
            </NavLink>
          )}
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
