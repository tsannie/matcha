import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import checkIcon from '../assets/icons/check.svg';
import XCloseIcon from '../assets/icons/x-close.svg?react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === true) return;

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

    verifyAccount();

    return () => {
      effectRan.current = true;
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <Card className="w-full max-w-md text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary1 mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-700">Verifying your account...</h2>
            <p className="text-gray-500 mt-2">Please wait a moment while we validate your email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-6">
              <img
                src={checkIcon}
                alt=""
                className="h-8 w-8"
                style={{
                  filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)',
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-primary1">Verified!</h2>
            <p className="text-gray-600 mt-2">Your email has been successfully verified.</p>
            <p className="text-sm text-gray-400 mt-6 animate-pulse">Redirecting you to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-6">
              <XCloseIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mt-2">The link is invalid or has expired.</p>

            <div className="mt-8 w-full">
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
