import React from 'react';

const Badge = ({ children, onRemove, className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-sm font-medium leading-none
        bg-primary1/10 text-primary1 border border-primary1/20
        ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;
