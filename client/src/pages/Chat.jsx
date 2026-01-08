import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import EmptyState from '../components/chat/EmptyState';

const Chat = () => {
  const { activeChat, fetchConversations } = useChat();

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Chat with your matches</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
        <div className="flex h-full">
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <ConversationList />
          </div>
          <div className="flex-1 flex flex-col">
            {activeChat ? <MessageThread /> : <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
