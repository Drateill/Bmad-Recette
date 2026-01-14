import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  const baseClass =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors';
  const variantClass =
    variant === 'primary'
      ? 'bg-brand-primary text-text-inverse hover:bg-brand-primary-dark'
      : 'border border-border-subtle text-text-secondary hover:bg-surface-muted';
  return (
    <button
      className={`${baseClass} ${variantClass} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
