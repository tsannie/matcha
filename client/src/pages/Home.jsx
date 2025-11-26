import { useNavigate } from 'react-router';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token from storage
    localStorage.removeItem('token');
    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 border border-primary3/30">
        <h1 className="text-3xl font-bold text-primary1 mb-4">Welcome to Matcha 🍵</h1>

        <p className="text-gray-700 mb-6">
          You are successfully logged in. This is the dashboard where profile suggestions will appear.
        </p>

        <div className="p-4 bg-gray-50 border-l-4 border-primary1 rounded">
          <h3 className="font-semibold text-lg">Next Steps:</h3>
          <ul className="list-disc ml-5 mt-2 text-sm text-gray-600">
            <li>Complete User Profile (Gender, Bio, Interests)</li>
            <li>Implement Geolocation</li>
            <li>Browse suggestions</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
