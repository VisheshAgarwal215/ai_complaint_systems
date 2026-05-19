import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const linkClass = (path) => `nav-link ${pathname === path ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        Smart Complaints
      </Link>
      <div className="nav-links">
        <Link to="/dashboard" className={linkClass('/dashboard')}>
          Dashboard
        </Link>
        <Link to="/complaints/new" className={linkClass('/complaints/new')}>
          New Complaint
        </Link>
        <Link to="/ai-analyze" className={`${linkClass('/ai-analyze')} ai-nav`}>
          ✨ AI Analyze
        </Link>
      </div>
      <div className="nav-user">
        <span>{user?.name}</span>
        <button type="button" className="btn btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
