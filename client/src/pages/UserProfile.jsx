import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../api/axios';
import toast from 'react-hot-toast';
import PhotoCarousel from '../components/ui/PhotoCarousel';
import BlockModal from '../components/ui/BlockModal';
import ReportModal from '../components/ui/ReportModal';
import LikeButton from '../components/ui/LikeButton';
import ArrowDown from '../assets/icons/arrow-down.svg?react';
import ReportIcon from '../assets/icons/report.svg?react';
import BlockIcon from '../assets/icons/block.svg?react';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

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

  const handleLikeChange = (liked, isMatch) => {
    setUser((prev) => ({ ...prev, liked_by_me: liked, is_match: isMatch }));
  };

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${userId}`);
      toast.success('User blocked');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to block user');
    } finally {
      setShowBlockModal(false);
    }
  };

  const handleReport = async (reason) => {
    try {
      await api.post(`/reports/${userId}`, { reason });
      toast.success('User reported. Thank you for keeping Matcha safe!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to report user');
    } finally {
      setShowReportModal(false);
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
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2">
        <ArrowDown className="w-5 h-5 rotate-90" />
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
                <p className="text-sm text-gray-400 mt-1">Last seen {new Date(user.last_seen).toLocaleDateString()}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-xl font-semibold">{user.fame_rating}</span>
            </div>
          </div>

          {/* Gender & Preference */}
          <div className="flex gap-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{user.gender}</span>
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
            <LikeButton
              userId={userId}
              likedByMe={user.liked_by_me}
              onLikeChange={handleLikeChange}
              className="flex-grow py-3 text-lg"
            />

            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              title="Report as fake"
            >
              <ReportIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowBlockModal(true)}
              className="px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 text-red-600"
              title="Block user"
            >
              <BlockIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showReportModal && (
        <ReportModal username={user.username} onSubmit={handleReport} onCancel={() => setShowReportModal(false)} />
      )}

      {showBlockModal && (
        <BlockModal username={user.username} onConfirm={handleBlock} onCancel={() => setShowBlockModal(false)} />
      )}
    </div>
  );
};

export default UserProfile;
