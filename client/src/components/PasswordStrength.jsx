import React from 'react';

const PasswordStrength = ({ password }) => {
  const criteria = [
    { label: 'At least 8 chars', valid: password.length >= 8 },
    { label: '1 Uppercase', valid: /(?=.*[A-Z])/.test(password) },
    { label: '1 Lowercase', valid: /(?=.*[a-z])/.test(password) },
    { label: '1 Number', valid: /(?=.*\d)/.test(password) },
    { label: '1 Symbol', valid: /(?=.*[\W_])/.test(password) },
  ];

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
      {criteria.map((item, index) => (
        <div
          key={index}
          className={`text-xs flex items-center gap-1 transition-colors duration-200 ${
            item.valid ? 'text-green-600 font-medium' : 'text-red-500'
          }`}
        >
          {/* Icons: Check or Cross */}
          <span>{item.valid ? '✓' : '✕'}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default PasswordStrength;
