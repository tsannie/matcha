import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = () => {
  const { conversations, activeChat, setActiveChat, unreadCounts } = useChat();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-center">No conversations yet</p>
        <p className="text-sm text-center mt-2">
          Match with someone to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const isActive = activeChat?.id === conv.user_id;
        const unreadCount = unreadCounts[conv.user_id] || 0;

        return (
          <button
            key={conv.user_id}
            onClick={() => setActiveChat({ id: conv.user_id, username: conv.username })}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-primary3/10 border-l-4 border-primary1' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Profile Picture */}
              <div className="relative">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                  {conv.profile_picture ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${conv.profile_picture}`}
                      alt={conv.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary1 font-bold">
                      {conv.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                {conv.is_online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {conv.username}
                  </span>
                  {conv.last_message_time && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {conv.last_message || 'Start a conversation...'}
                  </p>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-primary1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
