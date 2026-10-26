import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Shield, Sparkles } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo.user@kansei.ai');
    setPassword('DemoPassword123!');
    setError('');
  };

  return (
    <div className="container py-4 py-md-5 d-flex align-items-center justify-content-center min-vh-75">
      <div className="w-100" style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-3"
            style={{
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.30)',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.20)',
            }}
          >
            <LogIn size={26} color="#00F2FE" />
          </div>
          <h1 className="h3 text-white fw-bold mb-1">Welcome Back</h1>
          <p className="text-secondary small">
            Sign in to access your sentiment models, history, and analytics.
          </p>
        </div>

        <GlassCard variant="deep" glow="blue" className="p-4 p-sm-5">
          <ErrorAlert message={error} onDismiss={() => setError('')} />

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium d-flex align-items-center gap-1">
                <Mail size={14} color="var(--text-muted)" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className="form-control form-control-glass"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small fw-medium mb-0 d-flex align-items-center gap-1">
                  <Lock size={14} color="var(--text-muted)" />
                  <span>Password</span>
                </label>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Min. 8 characters
                </span>
              </div>
              <input
                type="password"
                className="form-control form-control-glass"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me Checkbox & Demo Fill */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div className="form-check d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label text-secondary small" htmlFor="rememberMe">
                  Remember session
                </label>
              </div>

              <button
                type="button"
                onClick={handleFillDemo}
                className="btn btn-sm btn-kansei-glass text-cyan small py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '0.75rem' }}
                title="Fill pre-configured demo account"
              >
                <Sparkles size={12} color="#00F2FE" />
                <span>Fill Demo Credentials</span>
              </button>
            </div>

            {/* Submit Button */}
            <GlowButton
              type="submit"
              variant="primary"
              size="md"
              className="w-100"
              isLoading={isLoading}
              icon={LogIn}
            >
              Sign In to Workspace
            </GlowButton>
          </form>

          {/* Security Note */}
          <div
            className="mt-4 p-2 rounded-3 text-center d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass-subtle)',
            }}
          >
            <Shield size={13} color="var(--text-muted)" />
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Secured with server-side sessions, CSRF, and user isolation.
            </span>
          </div>

          {/* Footer Navigation */}
          <div className="mt-4 text-center">
            <span className="text-secondary small">Don't have an account? </span>
            <Link to="/register" className="text-cyan small fw-semibold text-decoration-none">
              Register now →
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
