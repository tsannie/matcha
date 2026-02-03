import { useState } from 'react';
import Button from './Button';

const ReportModal = ({ username, onSubmit, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-xl font-bold mb-4">Report User</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="text-sm text-gray-700 mb-2 block">
              Why are you reporting {username}?
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary1 focus:border-transparent resize-none"
              rows="4"
              placeholder="Optional: Provide details..."
            />
          </label>
          <div className="flex gap-3">
            <Button type="submit" className="flex-grow bg-red-600 hover:bg-red-700">
              Submit Report
            </Button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
