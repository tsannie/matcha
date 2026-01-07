import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to Socket.io server
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      console.log('📬 Notification received:', notification);

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      if (notification.type === 'like') {
        toast('💖 ' + notification.message, {
          icon: '💖',
          duration: 3000
        });
      } else if (notification.type === 'match') {
        toast.success('💕 ' + notification.message, {
          duration: 5000
        });
      } else if (notification.type === 'view') {
        toast('👀 ' + notification.message, {
          icon: '👀',
          duration: 3000
        });
      } else if (notification.type === 'unlike') {
        toast(notification.message, {
          icon: '💔',
          duration: 3000
        });
      }
    });

    // Listen for user status updates
    newSocket.on('user-status', (data) => {
      console.log('User status update:', data);
      // You can handle online/offline status here
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const markAsRead = () => {
    setUnreadCount(0);
    // Optionally mark notifications as read in the database
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications,
        socket
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
