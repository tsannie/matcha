import React from 'react';
import SpinnerIcon from '../../assets/icons/spinner.svg?react';

const Button = ({ children, onClick, type = 'button', disabled, loading, secondary, className = '' }) => {
  const isDisabled = disabled || loading;

  const baseStyle =
    'px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
  const primaryStyle = 'bg-primary1 text-white hover:opacity-90 shadow-md';
  const secondaryStyle = 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  const variantStyle = secondary ? secondaryStyle : primaryStyle;

  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className={`${baseStyle} ${variantStyle} ${className}`}>
      {loading && <SpinnerIcon className="w-5 h-5 animate-spin text-white" />}
      {children}
    </button>
  );
};

export default Button;
