import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PasswordStrength from '../components/PasswordStrength';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return toast.error('Missing token.');

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });

      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to reset password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
        <Card className="w-full max-w-md text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            ⚠️ Invalid or missing reset token.
          </div>
          <Link to="/login" className="text-primary1 hover:underline font-bold">
            Return to Login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <Card className="w-full max-w-md">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Set New Password</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
            <div className="mt-2">
              <PasswordStrength password={formData.newPassword} />
            </div>
          </div>

          <div>
            <Input
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
