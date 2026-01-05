import { useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <Card className="w-full max-w-md">
        <h2 className="mb-4 text-3xl font-bold text-center text-primary1">Reset Password</h2>
        <p className="mb-8 text-center text-gray-500 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary1 transition-colors">
            ← Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
