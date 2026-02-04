import { Routes, Route, Navigate } from 'react-router';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import VerifyEmail from './VerifyEmail';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import CompleteProfile from './CompleteProfile';
import MyLikes from './MyLikes';
import EditProfile from './EditProfile';
import Chat from './Chat';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';

const App = () => {
  return (
    <div className="w-screen min-h-screen">
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
            <Route path="/likes" element={<MyLikes />} />
            <Route path="/profile" element={<EditProfile />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
