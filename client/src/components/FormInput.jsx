const FormInput = ({ label, name, type = 'text', onChange, note, colSpan = 'col-span-2', children }) => (
  <div className={colSpan}>
    <label htmlFor={name} className="block text-sm font-medium text-primary2 mb-1">
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      required
      onChange={onChange}
      className="w-full px-3 py-2 border border-primary3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary1 focus:border-transparent transition-all duration-200 bg-white"
    />
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    {children}
  </div>
);

export default FormInput;
