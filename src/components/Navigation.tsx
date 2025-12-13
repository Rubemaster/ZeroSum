import { NavLink } from 'react-router-dom';
import SearchBar from './SearchBar';
import './Navigation.css';

interface NavigationProps {
  variant?: 'default' | 'glass';
}

const Navigation = ({ variant = 'default' }: NavigationProps) => {
  const navClass = variant === 'glass' ? 'island-nav island-nav-glass' : 'island-nav';

  return (
    <nav className={navClass}>
      <div className="nav-brand">
        <span className="brand-name">ZEROSUM</span>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/trade" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Trade
        </NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Portfolio
        </NavLink>
        <NavLink to="/markets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Markets
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          History
        </NavLink>
        <NavLink to="/glass" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Glass
        </NavLink>
      </div>

      <div className="nav-actions">
        <SearchBar />
        <button className="btn-secondary">Sign In</button>
        <button className="btn-primary">Get Started</button>
      </div>
    </nav>
  );
};

export default Navigation;
