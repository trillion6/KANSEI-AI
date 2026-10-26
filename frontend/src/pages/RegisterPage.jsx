import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ShieldCheck, Check } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Too Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
  const strengthColors = ['#64748B', '#F43F5E', '#F59E0B', '#38BDF8', '#10B981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setError('Please complete all personal and account fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setError('Please acknowledge the terms of service and privacy agreement.');
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName.trim(), username.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4 py-md-5 d-flex align-items-center justify-content-center min-vh-75">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-3"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.30)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.20)',
            }}
          >
            <UserPlus size={26} color="#F59E0B" />
          </div>
          <h1 className="h3 text-white fw-bold mb-1">Create Account</h1>
          <p className="text-secondary small">
            Get started with KANSEI AI sentiment intelligence studio.
          </p>
        </div>

        <GlassCard variant="deep" glow="amber" className="p-4 p-sm-5">
          <ErrorAlert message={error} onDismiss={() => setError('')} />

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-medium d-flex align-items-center gap-1">
                  <User size={14} color="var(--text-muted)" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  placeholder="e.g. Alex Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-medium">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control form-control-glass font-monospace"
                  placeholder="alex.vance"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium d-flex align-items-center gap-1">
                <Mail size={14} color="var(--text-muted)" />
                <span>Work Email Address</span>
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

            <div className="row g-3 mb-2">
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-medium d-flex align-items-center gap-1">
                  <Lock size={14} color="var(--text-muted)" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  className="form-control form-control-glass"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control form-control-glass"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Password Strength
                  </span>
                  <span
                    className="small fw-semibold"
                    style={{ fontSize: '0.72rem', color: strengthColors[strength] }}
                  >
                    {strengthLabels[strength]}
                  </span>
                </div>
                <div
                  className="progress rounded-pill overflow-hidden"
                  style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(strength / 4) * 100}%`,
                      backgroundColor: strengthColors[strength],
                      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="form-check d-flex align-items-start gap-2 mb-4 mt-3">
              <input
                className="form-check-input mt-1"
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label className="form-check-label text-secondary small lh-sm" htmlFor="terms">
                I agree to the KANSEI AI acceptable use guidelines and data privacy terms.
              </label>
            </div>

            <GlowButton
              type="submit"
              variant="amber"
              size="md"
              className="w-100"
              isLoading={isLoading}
              icon={UserPlus}
            >
              Complete Registration
            </GlowButton>
          </form>

          <div className="mt-4 text-center">
            <span className="text-secondary small">Already registered? </span>
            <Link to="/login" className="text-amber small fw-semibold text-decoration-none">
              Sign in to your account →
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
