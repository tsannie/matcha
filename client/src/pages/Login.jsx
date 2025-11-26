import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Check your version (react-router-dom vs react-router)
import toast from 'react-hot-toast';
import api from '../api/axios';
import FormInput from '../components/FormInput';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', formData);

      // 1. Store the token (Local Storage is fine for Matcha)
      const { token, user } = response.data;
      localStorage.setItem('token', token);

      // Optional: Store basic user info if you need it globally without refetching immediately
      // localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.username}!`);

      // 2. Redirect to dashboard or home
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Invalid credentials';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl border border-primary3/30">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput name="username" label="Username" onChange={handleChange} />

          <div>
            <FormInput name="password" label="Password" type="password" onChange={handleChange} />
            {/* Password Reset Requirement  */}
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs text-primary1 hover:text-hover hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 text-white font-semibold rounded-lg bg-primary1 hover:bg-hover transform transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary1"
            >
              Log In
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary1 hover:text-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
