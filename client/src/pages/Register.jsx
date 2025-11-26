import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Attention: verifie si tu utilises 'react-router' ou 'react-router-dom'
import toast from 'react-hot-toast';
import api from '../api/axios';

// Reusable input component
const FormInput = ({ label, name, type = 'text', onChange, note, colSpan = 'col-span-2' }) => (
  <div className={colSpan}>
    {/* Utilisation de primary2 pour le label (lisibilité) */}
    <label htmlFor={name} className="block text-sm font-medium text-primary2 mb-1">
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      required
      onChange={onChange}
      // Bordure primary1 + Ring au focus
      className="w-full px-3 py-2 border border-primary3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary1 focus:border-transparent transition-all duration-200 bg-white"
    />
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const fieldsConfig = [
    { name: 'firstname', label: 'First Name', colSpan: 'col-span-1' },
    { name: 'lastname', label: 'Last Name', colSpan: 'col-span-1' },
    { name: 'username', label: 'Username' },
    { name: 'email', label: 'Email', type: 'email' },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      note: 'Min 8 chars, 1 Uppercase, 1 Lowercase, 1 Number, 1 Symbol.',
    },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await api.post('/auth/register', dataToSend);
      toast.success('Account created! Please check your email.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    // bg-bg utilise ta variable --color-bg (#f5f5f5)
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl border border-primary3/30">
        {/* text-primary1 pour le titre (#00a699) */}
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Create Account</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          {fieldsConfig.map((field) => (
            <FormInput key={field.name} {...field} onChange={handleChange} />
          ))}

          <div className="col-span-2 mt-4">
            <button
              type="submit"
              // bg-primary1 par défaut, bg-hover au survol
              className="w-full py-3 text-white font-semibold rounded-lg bg-primary1 hover:bg-hover transform transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary1"
            >
              Sign Up
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary1 hover:text-hover transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
