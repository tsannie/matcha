import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token } = response.data;

      await login(token);

      toast.success('Welcome back!');
      // PrivateRoute will handle redirection to /complete-profile if needed
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Invalid credentials';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <Card className="w-full max-w-md">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input name="username" label="Username" value={formData.username} onChange={handleChange} required />

          <div>
            <Input name="password" label="Password" type="password" value={formData.password} onChange={handleChange} required />
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs text-primary1 hover:text-hover hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary1 border-gray-300 rounded focus:ring-primary1"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
              Rester connecté
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={loading} className="w-full">
              Log In
            </Button>
          </div>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary1 hover:text-hover transition-colors">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
