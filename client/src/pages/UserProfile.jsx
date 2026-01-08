import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import PhotoCarousel from '../components/ui/PhotoCarousel';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Fetch user profile (you'll need to create this endpoint)
      const { data } = await api.get(`/profile/${userId}`);
      setUser(data);

      // Record profile view
      await api.post(`/views/${userId}`);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('User not found');
        navigate('/');
      } else if (error.response?.status === 403) {
        toast.error('Cannot view this profile');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      if (user.liked_by_me) {
        await api.delete(`/likes/${userId}`);
        toast.success('Unliked');
        setUser(prev => ({ ...prev, liked_by_me: false, is_match: false }));
      } else {
        const { data } = await api.post(`/likes/${userId}`);
        if (data.isMatch) {
          toast.success('It\'s a match! 💕', { duration: 4000 });
          setUser(prev => ({ ...prev, liked_by_me: true, is_match: true }));
        } else {
          toast.success('Liked! 💖');
          setUser(prev => ({ ...prev, liked_by_me: true }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to like');
    }
  };

  const handleBlock = async () => {
    if (!window.confirm('Are you sure you want to block this user? This will remove all interactions between you.')) {
      return;
    }

    try {
      await api.post(`/blocks/${userId}`);
      toast.success('User blocked');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to block user');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/reports/${userId}`, { reason: reportReason });
      toast.success('User reported. Thank you for keeping Matcha safe!');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to report user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">User not found</div>
      </div>
    );
  }

  const age = user.birthdate ? new Date().getFullYear() - new Date(user.birthdate).getFullYear() : '?';

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header with back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-96 bg-gray-200">
          <PhotoCarousel images={user.images} username={user.username} />

          {/* Match Badge */}
          {user.is_match && (
            <div className="absolute top-4 right-4 bg-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
              💕 Matched!
            </div>
          )}

          {/* Online Status */}
          {user.is_online && (
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Online
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstname} {user.lastname}, {age}
              </h1>
              <p className="text-gray-500">@{user.username}</p>
              {!user.is_online && user.last_seen && (
                <p className="text-sm text-gray-400 mt-1">
                  Last seen {new Date(user.last_seen).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-xl font-semibold">{user.fame_rating}</span>
            </div>
          </div>

          {/* Gender & Preference */}
          <div className="flex gap-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {user.gender}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {user.sexual_preference}
            </span>
          </div>

          {/* Biography */}
          {user.biography && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{user.biography}</p>
            </div>
          )}

          {/* Tags */}
          {user.tags && user.tags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-primary3/10 text-primary1 rounded-full text-sm border border-primary3/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              onClick={handleLike}
              className={`flex-grow py-3 text-lg ${
                user.liked_by_me
                  ? 'bg-pink-100 text-pink-600 border-pink-200 hover:bg-pink-200'
                  : 'bg-primary1 text-white'
              }`}
            >
              {user.liked_by_me ? '💖 Liked' : '💗 Like'}
            </Button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              title="Report as fake"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM12 8v5m0 4h.01"/>
              </svg>
            </button>

            <button
              onClick={handleBlock}
              className="px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 text-red-600"
              title="Block user"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Report User</h2>
            <form onSubmit={handleReport}>
              <label className="block mb-4">
                <span className="text-sm text-gray-700 mb-2 block">
                  Why are you reporting this user?
                </span>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary1 focus:border-transparent"
                  rows="4"
                  placeholder="Optional: Provide details..."
                />
              </label>
              <div className="flex gap-3">
                <Button type="submit" className="flex-grow bg-red-600 hover:bg-red-700">
                  Submit Report
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
