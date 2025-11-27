import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import PasswordStrength from '../components/PasswordStrength'; // Import du composant partagé

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

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
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">Invalid or missing reset token.</div>
        <Link to="/login" className="text-primary1 hover:underline">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl border border-primary3/30">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary1">Set New Password</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary2 mb-1">New Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-primary3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary1 focus:border-transparent bg-white"
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            <PasswordStrength password={formData.newPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary2 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-primary3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary1 focus:border-transparent bg-white"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 text-white font-semibold rounded-lg bg-primary1 hover:bg-hover transform transition-all duration-200 shadow-md"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
