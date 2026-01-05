import React from 'react';

const Button = ({ children, onClick, type = 'button', disabled, loading, secondary, className = '' }) => {
  const isDisabled = disabled || loading;

  const baseStyle =
    'px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const primaryStyle = 'bg-primary1 text-white hover:opacity-90 shadow-md';
  const secondaryStyle = 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  const variantStyle = secondary ? secondaryStyle : primaryStyle;

  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className={`${baseStyle} ${variantStyle} ${className}`}>
      {loading && (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
