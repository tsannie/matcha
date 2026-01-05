const Select = ({ label, value, onChange, options = [], name }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary1 bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
