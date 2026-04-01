import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PhotoCarousel from './PhotoCarousel';
import BlockModal from './BlockModal';
import ReportModal from './ReportModal';
import LikeButton from './LikeButton';
import XCloseIcon from '../../assets/icons/x-close.svg?react';
import ReportIcon from '../../assets/icons/flag.svg?react';
import BlockIcon from '../../assets/icons/block.svg?react';

const UserProfileModal = ({ userId, onClose, onLikeChange, onBlock }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  // ESC key listener
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isClosing) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isClosing, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/profile/${userId}`);
      setUser(data);

      // Record profile view
      await api.post(`/views/${userId}`);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('User not found');
        handleClose();
      } else if (error.response?.status === 403) {
        toast.error('Cannot view this profile');
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = (liked, isMatch) => {
    setUser((prev) => ({ ...prev, liked_by_me: liked, is_match: isMatch }));
    if (onLikeChange) {
      onLikeChange(userId, liked, isMatch);
    }
  };

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${userId}`);
      toast.success('User blocked');
      if (onBlock) onBlock(userId);
      handleClose();
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

  const age = user?.birthdate ? new Date().getFullYear() - new Date(user.birthdate).getFullYear() : '?';

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={(e) => e.target === e.currentTarget && !isClosing && handleClose()}
    >
      <div
        className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative ${
          isClosing ? 'animate-scale-out' : 'animate-scale-in'
        }`}
      >
        {/* X button */}
        <button
          onClick={handleClose}
          disabled={isClosing}
          className="absolute top-4 right-4 z-10 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all shadow-xl disabled:opacity-50"
          title="Close"
        >
          <XCloseIcon className="w-6 h-6 text-white" />
        </button>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-gray-400">Loading profile...</div>
          </div>
        )}

        {/* Error state */}
        {!loading && !user && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-400">User not found</div>
          </div>
        )}

        {/* Profile content */}
        {!loading && user && (
          <>
            {/* Profile Header */}
            <div className="relative h-64 md:h-80 bg-gray-200">
              <PhotoCarousel images={user.images} username={user.username} />

              {/* Match Badge */}
              {user.is_match && (
                <div className="absolute top-4 right-16 bg-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
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
            <div className="p-4 md:p-8">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
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
              <div className="flex gap-4 mb-4 md:mb-6">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{user.gender}</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {user.sexual_preference}
                </span>
              </div>

              {/* Biography */}
              {user.biography && (
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg font-semibold mb-2">About</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {!showFullBio && user.biography.length > 280
                      ? user.biography.slice(0, 280) + '...'
                      : user.biography}
                  </p>
                  {user.biography.length > 280 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-primary1 text-sm font-medium mt-2 hover:underline"
                    >
                      {showFullBio ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              {user.tags && user.tags.length > 0 && (
                <div className="mb-4 md:mb-6">
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
              <div className="flex gap-3 mt-6 md:mt-8">
                <LikeButton
                  userId={userId}
                  likedByMe={user.liked_by_me}
                  onLikeChange={handleLikeChange}
                  className="flex-grow py-3 text-lg"
                />

                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  title="Report user"
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
          </>
        )}

        {/* Nested modals */}
        {showReportModal && user && (
          <ReportModal username={user.username} onSubmit={handleReport} onCancel={() => setShowReportModal(false)} />
        )}

        {showBlockModal && user && (
          <BlockModal username={user.username} onConfirm={handleBlock} onCancel={() => setShowBlockModal(false)} />
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
