import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PasswordStrength from '../components/PasswordStrength';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error('Password does not meet requirements.');
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await api.post('/auth/register', dataToSend);
      toast.success('Account created! Please check your email.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <Card className="w-full max-w-md">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Create Account</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div className="col-span-1">
            <Input name="firstname" label="First Name" value={formData.firstname} onChange={handleChange} />
          </div>

          <div className="col-span-1">
            <Input name="lastname" label="Last Name" value={formData.lastname} onChange={handleChange} />
          </div>

          <div className="col-span-2">
            <Input name="username" label="Username" value={formData.username} onChange={handleChange} />
          </div>

          <div className="col-span-2">
            <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="col-span-2">
            <Input name="password" label="Password" type="password" value={formData.password} onChange={handleChange} />
            <div className="mt-2">
              <PasswordStrength password={formData.password} />
            </div>
          </div>

          <div className="col-span-2">
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="col-span-2 mt-4">
            <Button type="submit" loading={loading} className="w-full">
              Sign Up
            </Button>
          </div>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary1 hover:text-hover transition-colors">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
