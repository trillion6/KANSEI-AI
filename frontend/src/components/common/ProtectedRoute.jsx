import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cpu } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-75 py-5">
        <div
          className="d-inline-flex p-3 rounded-circle mb-3 animate-pulse"
          style={{
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)',
          }}
        >
          <Cpu size={32} color="#00F2FE" />
        </div>
        <p className="text-secondary small fw-medium">Verifying KANSEI AI security session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
