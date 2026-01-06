import { Routes, Route, Navigate } from 'react-router';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import VerifyEmail from './VerifyEmail';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import CompleteProfile from './CompleteProfile';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <div className="w-screen h-screen">
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Routes Publiques (Pas de Navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<PrivateRoute />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<div className="p-10 text-center">Page Profil (A faire)</div>} />
            <Route path="/chat" element={<div className="p-10 text-center">Page Chat (A faire)</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
