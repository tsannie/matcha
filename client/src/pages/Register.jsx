import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Check import based on your version
import toast from 'react-hot-toast';
import api from '../api/axios';
import FormInput from '../components/FormInput';

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
    { name: 'password', label: 'Password', type: 'password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordCriteria = (password) => [
    { label: '8 Characters', valid: password.length >= 8 },
    { label: '1 Uppercase letter', valid: /(?=.*[A-Z])/.test(password) },
    { label: '1 Lowercase letter', valid: /(?=.*[a-z])/.test(password) },
    { label: '1 Number', valid: /(?=.*\d)/.test(password) },
    { label: '1 Special character', valid: /(?=.*[\W_])/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error('Password does not meet requirements.');
    }

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
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl border border-primary3/30">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Create Account</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          {fieldsConfig.map((field) => (
            <FormInput key={field.name} {...field} onChange={handleChange}>
              {field.name === 'password' && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {getPasswordCriteria(formData.password).map((criteria, index) => (
                    <div
                      key={index}
                      className={`text-xs flex items-center gap-1 transition-colors duration-200 ${
                        criteria.valid ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <span>{criteria.valid ? '✓' : '✕'}</span>
                      {criteria.label}
                    </div>
                  ))}
                </div>
              )}
            </FormInput>
          ))}

          <div className="col-span-2 mt-4">
            <button
              type="submit"
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
