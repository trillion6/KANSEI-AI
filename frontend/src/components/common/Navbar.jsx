import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BarChart2,
  Clock,
  LogOut,
  Menu,
  X,
  Activity,
  LayoutDashboard,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlowButton from './GlowButton';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Overview', icon: Sparkles },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analyzer', label: 'Analyzer', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/history', label: 'History', icon: Clock },
  ];

  return (
    <nav
      className="navbar navbar-expand-lg fixed-top py-2"
      style={{
        background: 'rgba(7, 11, 25, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass-subtle)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)',
        zIndex: 1050,
        minHeight: '72px',
      }}
    >
      <div className="container-fluid px-3 px-sm-4 px-lg-5">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center gap-2 gap-sm-3 text-decoration-none py-1 me-0 me-sm-3"
          aria-label="KANSEI AI Home"
        >
          {/* Custom Infinity Logo - Clean & Borderless without square background */}
          <img
            src="/kansei-logo.png"
            alt="KANSEI AI"
            style={{
              height: '40px',
              width: 'auto',
              maxHeight: '40px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
              filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.25))',
            }}
          />

          {/* Brand Wordmark & Subtitle */}
          <div className="d-flex flex-column justify-content-center" style={{ minWidth: 0, flexShrink: 0 }}>
            <div
              className="fw-extrabold text-white lh-1 tracking-tight d-flex align-items-center gap-1"
              style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
            >
              <span>KANSEI</span>
              <span className="text-gradient-cyan">AI</span>
            </div>
            <span
              className="d-none d-sm-block text-uppercase text-truncate"
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.10em',
                fontWeight: 600,
                marginTop: '3px',
                color: 'var(--text-muted)',
                lineHeight: 1,
              }}
            >
              Intelligent Sentiment
            </span>
          </div>
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button
          className="navbar-toggler p-2 rounded-3 text-white d-lg-none"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: isOpen ? '1px solid rgba(0, 242, 254, 0.40)' : '1px solid var(--border-glass-subtle)',
            color: '#F8FAFC',
            boxShadow: isOpen ? '0 0 14px rgba(0, 242, 254, 0.25)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation Items & Auth Controls */}
        <div
          className={`collapse navbar-collapse navbar-collapse-kansei ${isOpen ? 'show' : ''
            }`}
        >
          <ul className="navbar-nav mx-auto mb-3 mb-lg-0 gap-1">
            {navLinks.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `nav-link-kansei ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User Account Actions */}
          <div className="d-flex align-items-center gap-2 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-2 w-100 justify-content-between justify-content-lg-end">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-sm btn-kansei-glass d-flex align-items-center gap-2 text-decoration-none"
                  title="View Profile and Settings"
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold"
                    style={{
                      width: '28px',
                      height: '28px',
                      background: 'linear-gradient(135deg, #00F2FE, #3B82F6)',
                      color: '#070B19',
                      fontSize: '0.78rem',
                      boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
                    }}
                  >
                    {(user?.full_name || user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="d-inline small text-white fw-medium text-truncate" style={{ maxWidth: '140px' }}>
                    {user?.full_name || user?.name || user?.username || 'Account'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-sm btn-kansei-glass text-secondary p-2 d-flex align-items-center justify-content-center"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 w-100 justify-content-start justify-content-lg-end">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-sm btn-kansei-glass d-flex align-items-center gap-2 text-decoration-none"
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-decoration-none"
                >
                  <GlowButton variant="primary" size="sm" icon={UserPlus}>
                    Register
                  </GlowButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
