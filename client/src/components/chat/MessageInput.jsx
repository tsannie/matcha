import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import Button from '../ui/Button';
import SendIcon from '../../assets/icons/send.svg?react';

const MessageInput = () => {
  const { activeChat, sendMessage, startTyping, stopTyping } = useChat();
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleTyping = (value) => {
    setContent(value);

    if (!activeChat) return;

    // Start typing indicator
    startTyping(activeChat.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeChat.id);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || !activeChat) return;

    sendMessage(activeChat.id, content.trim());
    setContent('');
    stopTyping(activeChat.id);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          rows="1"
          maxLength="2000"
          className="flex-1 resize-none p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary1 transition-all"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={!content.trim()} className="px-6 py-3">
          <SendIcon className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
    </form>
  );
};

export default MessageInput;
