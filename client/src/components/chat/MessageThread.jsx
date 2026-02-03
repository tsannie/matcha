import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import MessageInput from './MessageInput';
import Message from './Message';
import MenuDotsIcon from '../../assets/icons/menu-dots.svg?react';
import FlagIcon from '../../assets/icons/flag.svg?react';
import BlockIcon from '../../assets/icons/block.svg?react';
import BlockModal from '../ui/BlockModal';
import ReportModal from '../ui/ReportModal';

const MessageThread = () => {
  const { activeChat, messages, fetchMessages, typing, setActiveChat, fetchConversations } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (activeChat) {
      setLoading(true);
      fetchMessages(activeChat.id).finally(() => setLoading(false));
    }
  }, [activeChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeChat?.id]]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const chatMessages = messages[activeChat?.id] || [];
  const isTyping = typing[activeChat?.id];

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${activeChat.id}`);
      toast.success(`${activeChat.username} has been blocked`);
      setActiveChat(null);
      fetchConversations();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.error || 'Failed to block user');
    } finally {
      setShowBlockModal(false);
    }
  };

  const handleReport = async (reason) => {
    try {
      await api.post(`/reports/${activeChat.id}`, { reason: reason.trim() });
      toast.success(`${activeChat.username} has been reported`);
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error(error.response?.data?.error || 'Failed to report user');
    } finally {
      setShowReportModal(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary3/20 flex items-center justify-center text-primary1 font-bold">
            {activeChat.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{activeChat.username}</h3>
            {isTyping && <span className="text-xs text-gray-500 italic">typing...</span>}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MenuDotsIcon className="w-5 h-5 opacity-60" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FlagIcon className="w-4 h-4" />
                  Report User
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <BlockIcon className="w-4 h-4" />
                  Block User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400">Loading messages...</div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <Message key={msg.id} message={msg} isOwn={msg.sender_id === user.id} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput />

      {showReportModal && (
        <ReportModal
          username={activeChat.username}
          onSubmit={handleReport}
          onCancel={() => setShowReportModal(false)}
        />
      )}

      {showBlockModal && (
        <BlockModal
          username={activeChat.username}
          onConfirm={handleBlock}
          onCancel={() => setShowBlockModal(false)}
        />
      )}
    </>
  );
};

export default MessageThread;
