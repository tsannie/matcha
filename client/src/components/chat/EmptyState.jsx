const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <div className="text-7xl mb-4">💬</div>
      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
      <p className="text-sm text-center max-w-sm">
        Choose a conversation from the list to start messaging with your matches
      </p>
    </div>
  );
};

export default EmptyState;
