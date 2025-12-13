import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
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
        <NavLink to="/kyc" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          KYC
        </NavLink>
      </div>

      <div className="nav-actions">
        <SearchBar />
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn-secondary">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary">Get Started</button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  width: 36,
                  height: 36
                }
              }
            }}
          />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navigation;
