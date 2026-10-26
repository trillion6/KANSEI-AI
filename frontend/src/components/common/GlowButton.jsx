import React from 'react';

export default function GlowButton({
  children,
  variant = 'primary', // 'primary' | 'amber' | 'glass' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  icon: Icon = null,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variantClass = {
    primary: 'btn-kansei-primary',
    amber: 'btn-kansei-amber',
    glass: 'btn-kansei-glass',
    danger: 'btn-kansei-danger',
  }[variant] || 'btn-kansei-primary';

  const sizeClass = {
    sm: 'py-1 px-3 fs-7',
    md: 'py-2 px-4',
    lg: 'py-3 px-5 fs-5',
  }[size] || 'py-2 px-4';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${variantClass} ${sizeClass} ${className} d-inline-flex align-items-center justify-content-center gap-2`}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 15 : size === 'lg' ? 22 : 18} />}
          {children}
        </>
      )}
    </button>
  );
}
