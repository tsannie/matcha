import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import logo from '../assets/logo_matcha.png';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Si l'utilisateur n'est pas chargé (ex: avant redirection), on affiche juste le contenu
  if (!user) return <Outlet />;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-bg font-sans text-gray-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          {/* GAUCHE : Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="Matcha Logo"
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* DROITE : Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* 1. Chat */}
            <Link
              to="/chat"
              className={`relative p-2 rounded-full transition-colors ${
                isActive('/chat') ? 'text-primary1 bg-primary3/10' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </Link>

            {/* 2. Notifications (Placeholder pour le moment) */}
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              {/* Badge rouge exemple */}
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* 3. Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                  {user.images && user.images.find((img) => img.is_profile_picture) ? (
                    <img
                      src={user.images.find((img) => img.is_profile_picture).file_path}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary1 font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </button>

              {/* Menu Déroulant */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Edit Profile
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
