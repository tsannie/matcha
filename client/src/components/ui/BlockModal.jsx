import Button from './Button';

const BlockModal = ({ username, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-xl font-bold mb-4">Block User</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to block {username}? This will remove all interactions between you.
        </p>
        <div className="flex gap-3">
          <Button onClick={onConfirm} className="flex-grow bg-red-600 hover:bg-red-700">
            Block
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockModal;
