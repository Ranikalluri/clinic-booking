import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <Link to="/" className="brand">City Clinic</Link>
      <nav>
        {user?.role === 'patient' && <NavLink to="/">Find a doctor</NavLink>}
        {user && <NavLink to="/appointments">{user.role === 'doctor' ? 'Schedule' : 'My appointments'}</NavLink>}
        {user?.role === 'doctor' && <NavLink to="/settings">Working hours</NavLink>}
        {user ? (
          <button className="link" onClick={() => { logout(); navigate('/'); }}>
            Log out ({user.name.split(' ')[0]})
          </button>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register" className="btn small">Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
