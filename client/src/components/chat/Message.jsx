import { format } from 'date-fns';

const Message = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary1 text-white rounded-br-sm'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <span
          className={`text-xs mt-1 block ${
            isOwn ? 'text-primary3/70' : 'text-gray-500'
          }`}
        >
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
    </div>
  );
};

export default Message;
