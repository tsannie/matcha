import React from 'react';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white p-8 rounded-xl shadow-xl border border-gray-100 ${className}`}>
      {title && <h2 className="text-xl font-semibold text-gray-700 mb-6">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
