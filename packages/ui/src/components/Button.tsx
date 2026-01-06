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
  const baseStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  };

  const variantStyle: React.CSSProperties = variant === 'primary'
    ? { backgroundColor: '#007bff', color: '#fff' }
    : { backgroundColor: '#6c757d', color: '#fff' };

  return (
    <button
      style={{ ...baseStyle, ...variantStyle, opacity: disabled ? 0.6 : 1 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
