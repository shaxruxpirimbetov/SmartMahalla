import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, getRole } from '../utils/auth';

// Two jobs, both opt-in via props so the same component works as either a
// wrapper (`<ProtectedRoute><Layout /></ProtectedRoute>`, children passed
// explicitly) or a layout route (`<ProtectedRoute requireAdmin />` with its
// own nested <Route> children, rendered through <Outlet/>):
//
// 1. Not logged in at all (no JWT session and no local role) -> /login,
//    remembering where they were headed so Login.jsx can send them back.
// 2. `requireAdmin` - logged in, but as 'public' (the "Login as Public"
//    button on Login.jsx) trying to reach /admin/* -> bounce to /dashboard
//    instead of /login, since they *are* authenticated, just not as admin.
function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && getRole() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;
