import React from 'react';
import XCloseIcon from '../../assets/icons/x-close.svg?react';

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
          <XCloseIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default Badge;
