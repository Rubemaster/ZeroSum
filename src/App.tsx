import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import Navigation from './components/Navigation';
import KYCGate from './components/KYCGate';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Markets from './pages/Markets';
import History from './pages/History';
import GlassDemo from './pages/GlassDemo';
import rockiesImage from './assets/rockies-snow.jpg';
import './App.css';

function ProtectedApp() {
  const location = useLocation();
  const isGlassPage = location.pathname === '/glass';

  return (
    <KYCGate>
      <div className="app theme-light">
        {/* Global SVG Filter for liquid glass distortion */}
        <svg className="svg-filters-global" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glass-distortion-global" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.004"
                numOctaves={2}
                seed={92}
                result="noise"
              />
              <feGaussianBlur in="noise" stdDeviation={2} result="blurredNoise" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurredNoise"
                scale={77}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Background */}
        {!isGlassPage && (
          <div className="app-background bg-rockies">
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${rockiesImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.15,
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        <Navigation variant="glass" />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/history" element={<History />} />
            <Route path="/glass" element={<GlassDemo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </KYCGate>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';

  // Auth pages don't need protection
  if (isAuthPage) {
    return (
      <div className="app theme-light">
        <div className="app-background bg-rockies">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${rockiesImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.15,
              pointerEvents: 'none',
            }}
          />
        </div>
        <main className="main-content">
          <Routes>
            <Route
              path="/sign-in/*"
              element={
                <div className="auth-container">
                  <SignIn routing="path" path="/sign-in" />
                </div>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="auth-container">
                  <SignUp routing="path" path="/sign-up" />
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    );
  }

  // Protected routes require sign-in and KYC
  return (
    <>
      <SignedIn>
        <ProtectedApp />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
