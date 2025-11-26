import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router'; // Check if using 'react-router-dom'
import api from '../api/axios';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

  useEffect(() => {
    const verifyAccount = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        toast.error('Invalid verification link.');
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });

        setStatus('success');
        toast.success('Account verified! Redirecting to login...');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        console.error(error);
        setStatus('error');
        const msg = error.response?.data?.error || 'Verification failed.';
        toast.error(msg);
      }
    };

    // Run verification on mount
    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-xl border border-primary3/30 text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary1 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-700">Verifying your account...</h2>
            <p className="text-gray-500 mt-2">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <span className="text-2xl text-green-600">✔</span>
            </div>
            <h2 className="text-2xl font-bold text-primary1">Verified!</h2>
            <p className="text-gray-600 mt-2">Your email has been successfully verified.</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting you to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <span className="text-2xl text-red-600">✖</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mt-2">The link is invalid or has expired.</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-4 py-2 bg-primary1 text-white rounded hover:bg-hover transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
