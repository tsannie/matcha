import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import Register from './Register';

// Placeholder pour Login (on le fera juste après)
const Login = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <h1 className="text-3xl font-bold text-blue-600">Login Page Coming Soon</h1>
  </div>
);

function App() {
  return (
    <div className="w-screen h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
