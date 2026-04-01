import { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket } = useNotifications();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typing, setTyping] = useState({});
  const [conversationErrors, setConversationErrors] = useState({});

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);

      const counts = {};
      data.forEach(conv => {
        counts[conv.user_id] = parseInt(conv.unread_count) || 0; // Force number conversion
      });
      console.log('📊 Unread counts loaded:', counts);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const updateConversationLastMessage = (userId, lastMessage) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.user_id === userId
          ? { ...conv, last_message: lastMessage, last_message_time: new Date().toISOString() }
          : conv
      )
    );
  };

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const { senderId, content, senderUsername } = message;

      // Normalize message format (add both camelCase and snake_case for compatibility)
      const normalizedMessage = {
        ...message,
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        created_at: message.createdAt,
        is_read: message.isRead
      };

      // Add to messages
      setMessages(prev => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), normalizedMessage]
      }));

      // Only show toast and increment unread if not viewing this conversation
      // Use window.location.pathname for real-time value since ChatProvider location is not reactive
      const currentPath = window.location.pathname;
      const isViewingThisChat = currentPath === '/chat' && parseInt(activeChat?.id) === parseInt(senderId);
      console.log(`🔍 Debug: pathname=${currentPath}, activeChat.id=${activeChat?.id}, senderId=${senderId}, isViewingThisChat=${isViewingThisChat}`);

      if (!isViewingThisChat) {
        // Increment unread count
        setUnreadCounts(prev => {
          const currentCount = parseInt(prev[senderId]) || 0; // Force number conversion
          const newCount = currentCount + 1;
          console.log(`📨 Incrementing unread for user ${senderId}: ${currentCount} -> ${newCount}`);
          return {
            ...prev,
            [senderId]: newCount
          };
        });

        toast(`💬 ${senderUsername}: ${content.substring(0, 50)}...`, {
          duration: 3000
        });
      } else {
        console.log(`👀 Message received from ${senderId} but already viewing this chat - not incrementing`);
      }

      // Update conversation list (but don't let it override unread counts)
      updateConversationLastMessage(senderId, content);
    };

    const handleMessageSent = (data) => {
      const { receiverId, content, id, createdAt } = data;

      setMessages(prev => ({
        ...prev,
        [receiverId]: [...(prev[receiverId] || []), {
          id,
          senderId: user.id,
          sender_id: user.id,
          receiverId,
          receiver_id: receiverId,
          content,
          createdAt,
          created_at: createdAt,
          isRead: false,
          is_read: false
        }]
      }));
    };

    const handleUserTyping = ({ userId }) => {
      setTyping(prev => ({ ...prev, [userId]: true }));
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTyping(prev => ({ ...prev, [userId]: false }));
    };

    const handleChatDeleted = ({ userId }) => {
      // Remove messages for this user
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[userId];
        return newMessages;
      });

      // Remove conversation from list
      setConversations(prev => prev.filter(conv => conv.user_id !== userId));

      // Reset unread count
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[userId];
        return newCounts;
      });

      // If this was the active chat, close it
      if (activeChat?.id === userId) {
        setActiveChat(null);
        toast('This conversation has been deleted', { icon: '💔' });
      }
    };

    const handleConversationUnavailable = ({ userId }) => {
      setConversationErrors(prev => ({ ...prev, [userId]: 'unavailable' }));
      setConversations(prev => prev.filter(conv => conv.user_id !== userId));
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('chat-deleted', handleChatDeleted);
    socket.on('conversation_unavailable', handleConversationUnavailable);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('chat-deleted', handleChatDeleted);
      socket.off('conversation_unavailable', handleConversationUnavailable);
    };
  }, [socket, activeChat, user]);

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/chat/messages/${userId}`);
      setMessages(prev => ({ ...prev, [userId]: data }));
      // Reset unread count for this conversation since we're viewing it
      setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
      // Update the conversation to reflect 0 unread
      setConversations(prev =>
        prev.map(conv =>
          conv.user_id === userId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        setConversationErrors(prev => ({ ...prev, [userId]: 'unavailable' }));
        setConversations(prev => prev.filter(conv => conv.user_id !== userId));
      } else {
        toast.error('Failed to load messages');
      }
    }
  };

  const sendMessage = (receiverId, content) => {
    if (!socket) {
      toast.error('Not connected to chat server');
      return;
    }
    socket.emit('send-message', { receiverId, content });
  };

  const startTyping = (receiverId) => {
    if (socket) socket.emit('typing-start', { receiverId });
  };

  const stopTyping = (receiverId) => {
    if (socket) socket.emit('typing-stop', { receiverId });
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeChat,
        setActiveChat,
        messages,
        unreadCounts,
        typing,
        conversationErrors,
        sendMessage,
        fetchMessages,
        fetchConversations,
        startTyping,
        stopTyping
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
