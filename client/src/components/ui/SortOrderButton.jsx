import ArrowDownIcon from '../../assets/icons/arrow-down.svg?react';

export default function SortOrderButton({ sortOrder, onToggle, className = '' }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
      title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
    >
      <ArrowDownIcon className={`w-5 h-5 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
    </button>
  );
}
