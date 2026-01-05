import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth, checkProfileComplete } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (!loading && user && !checkProfileComplete(user)) {
      navigate('/complete-profile');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary1 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <Card className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary1 mb-4">Welcome to Matcha 🍵</h1>

        <p className="text-gray-700 mb-6">
          You are successfully logged in as <span className="font-bold">{user.username}</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-700">Profile Status</h3>
            <p className="text-green-600 text-sm mt-1">Your profile is complete and visible to others.</p>
          </div>
          {/* ... */}
        </div>

        <Button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default Home;
