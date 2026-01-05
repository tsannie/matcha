import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      try {
        const response = await api.get('/profile');
        console.log(response.data);
        const { gender, sexual_preference, biography, tags, images, latitude, longitude } = response.data;

        const isProfileComplete =
          gender &&
          sexual_preference &&
          biography &&
          tags &&
          tags.length > 0 &&
          images &&
          images.length > 0 &&
          latitude &&
          longitude;

        if (!isProfileComplete) {
          navigate('/complete-profile');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    checkProfileCompleteness();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) {
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
          You are successfully logged in. This is the dashboard where profile suggestions will appear.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-700">Profile Status</h3>
            <p className="text-green-600 text-sm mt-1">Your profile is complete and visible to others.</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-bold text-purple-700">Discovery</h3>
            <p className="text-purple-600 text-sm mt-1">Searching for matches around you...</p>
          </div>
        </div>

        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default Home;
