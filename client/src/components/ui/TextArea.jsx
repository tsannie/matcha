const TextArea = ({ label, value, onChange, placeholder, maxLength, required }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows="5"
        required={required}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary1 resize-none"
      />
      {maxLength && (
        <div className="text-right text-xs text-gray-400 mt-1">
          {value?.length || 0}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default TextArea;
