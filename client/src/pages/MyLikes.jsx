import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ProfileCard from '../components/ProfileCard';
import UserProfileModal from '../components/ui/UserProfileModal';

const MyLikes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const tabs = [
    { id: 'liked_me', label: 'Liked Me', icon: '💖', endpoint: '/likes/received' },
    { id: 'i_liked', label: 'I Liked', icon: '💗', endpoint: '/likes/sent' },
    { id: 'matches', label: 'Matches', icon: '💕', endpoint: '/likes/matches' },
    { id: 'viewed_me', label: 'Viewed Me', icon: '👀', endpoint: '/views' },
  ];

  // Get active tab from URL or default to 'liked_me'
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabs.find((t) => t.id === tabFromUrl) ? tabFromUrl : 'liked_me';

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const currentTab = tabs.find((t) => t.id === activeTab);
      const { data } = await api.get(currentTab.endpoint);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Update like status locally to avoid scroll reset
  const handleLikeChange = (userId, likedByMe, isMatch) => {
    if (activeTab === 'i_liked' && !likedByMe) {
      // Remove from list when unliking in "I Liked" tab
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else if (activeTab === 'matches' && !likedByMe) {
      // Remove from matches when unliking
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      // Just update the status
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, liked_by_me: likedByMe, is_match: isMatch } : u))
      );
    }
  };

  const handleProfileClick = (userId) => setSelectedUserId(userId);
  const handleCloseModal = () => setSelectedUserId(null);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Likes</h1>
        <p className="text-gray-600">See who likes you, who you like, and your matches</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary1 text-primary1'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
          <div className="text-6xl mb-4">{tabs.find((t) => t.id === activeTab)?.icon}</div>
          <p className="text-lg">No users found</p>
          <p className="text-sm mt-2">
            {activeTab === 'liked_me' && 'No one has liked you yet. Keep browsing!'}
            {activeTab === 'i_liked' && "You haven't liked anyone yet. Start exploring!"}
            {activeTab === 'matches' && 'No matches yet. Like more profiles!'}
            {activeTab === 'viewed_me' && 'No one has viewed your profile yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
            <ProfileCard key={user.id} user={user} onLikeChange={handleLikeChange} onProfileClick={handleProfileClick} />
          ))}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={handleCloseModal} onLikeChange={handleLikeChange} />
      )}
    </div>
  );
};

export default MyLikes;
