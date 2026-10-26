import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Sliders, 
  ShieldAlert, 
  Save, 
  Check, 
  Trash2, 
  AlertTriangle,
  Cpu
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.full_name || user?.name || 'Workspace User');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'user');

  useEffect(() => {
    if (user) {
      setName(user.full_name || user.name || 'Workspace User');
      setEmail(user.email || '');
      setRole(user.role || 'user');
    }
  }, [user]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preference State
  const [threshold, setThreshold] = useState(85);
  const [autoSave, setAutoSave] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordMsg('Password security credentials successfully updated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="container-fluid px-lg-5 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 text-white fw-bold mb-1 d-flex align-items-center gap-2">
          <User size={26} color="#00F2FE" />
          <span>User Profile & Workspace Settings</span>
        </h1>
        <p className="text-secondary small mb-0">
          Manage your account credentials, neural model thresholds, and workspace security preferences.
        </p>
      </div>

      <div className="row g-4">
        {/* Profile Card & Account Information */}
        <div className="col-12 col-lg-4">
          <GlassCard glow="blue" className="text-center p-4 mb-4">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 text-dark fw-bold"
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #00F2FE 0%, #3B82F6 50%, #F59E0B 100%)',
                fontSize: '2rem',
                boxShadow: '0 0 25px rgba(0, 242, 254, 0.3)',
              }}
            >
              {name.charAt(0)}
            </div>

            <h2 className="h5 text-white fw-bold mb-1">{name}</h2>
            <span className="badge bg-white bg-opacity-10 text-cyan small mb-3">
              {role}
            </span>

            <div className="pt-3 border-top border-secondary border-opacity-25 text-start small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Account Email:</span>
                <span className="text-white font-monospace">{email}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Member Since:</span>
                <span className="text-white">October 2026</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Security Role:</span>
                <span className="text-success fw-semibold">Workspace Owner</span>
              </div>
            </div>
          </GlassCard>

          {/* Model Preferences */}
          <GlassCard header="Inference Preferences" className="p-4">
            <form onSubmit={handleSavePreferences}>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="text-secondary small fw-medium">
                    Confidence Alert Threshold
                  </label>
                  <span className="text-cyan fw-bold font-monospace">{threshold}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="50"
                  max="99"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Analyses below {threshold}% confidence will trigger a review tag.
                </span>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoSave"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                <label className="form-check-label text-secondary small" htmlFor="autoSave">
                  Auto-save all analyses to history
                </label>
              </div>

              <div className="form-check form-switch mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emailAlerts"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                />
                <label className="form-check-label text-secondary small" htmlFor="emailAlerts">
                  Weekly sentiment summary reports
                </label>
              </div>

              <GlowButton
                type="submit"
                variant="glass"
                size="sm"
                className="w-100"
                icon={savedSettings ? Check : Save}
              >
                {savedSettings ? 'Preferences Saved!' : 'Save Preferences'}
              </GlowButton>
            </form>
          </GlassCard>
        </div>

        {/* Security & Password Settings */}
        <div className="col-12 col-lg-8">
          <GlassCard header="Update Account Security" className="p-4 mb-4">
            {passwordMsg && (
              <div className="alert alert-success bg-success bg-opacity-10 border-success border-opacity-25 text-success small py-2">
                {passwordMsg}
              </div>
            )}
            <ErrorAlert message={passwordError} onDismiss={() => setPasswordError('')} />

            <form onSubmit={handleUpdatePassword}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-control form-control-glass"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-medium">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-glass"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-medium">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-glass"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <GlowButton type="submit" variant="primary" size="sm" icon={Lock}>
                Update Password
              </GlowButton>
            </form>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard header="Danger Zone" className="p-4 border-danger border-opacity-25">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 py-2 border-bottom border-secondary border-opacity-25">
              <div>
                <strong className="text-white small d-block">Clear Saved History</strong>
                <span className="text-muted small">
                  Permanently wipe all recorded customer analyses and confidence logs.
                </span>
              </div>
              <button type="button" className="btn btn-outline-danger btn-sm text-nowrap">
                Wipe History
              </button>
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 pt-3">
              <div>
                <strong className="text-white small d-block">Delete Workspace Account</strong>
                <span className="text-muted small">
                  Deactivate user profile, revoke session cookies, and purge database records.
                </span>
              </div>
              <button type="button" className="btn btn-danger btn-sm text-nowrap">
                Delete Account
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
