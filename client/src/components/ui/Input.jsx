const Input = ({ label, type = 'text', value, onChange, placeholder, name, error, min, max, required }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary1 transition-all ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Input;
