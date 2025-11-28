import { useState } from 'react';
import toast from 'react-hot-toast';

const InterestsStep = ({ tags, setTags }) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();

      if (!val) return;
      if (tags.includes(val)) {
        setTagInput('');
        return;
      }
      if (tags.length >= 20) return toast.error('Max 20 tags');

      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">Your Interests</h2>
      <p className="text-gray-500 text-sm">Type a tag and press Enter (ex: vegan, geek, gym...)</p>

      <div className="border border-gray-300 p-3 rounded-lg flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary1 bg-white min-h-[100px]">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-primary1/10 text-primary1 px-3 py-1 rounded-full text-sm flex items-center gap-2"
          >
            #{tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500 font-bold">
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={tags.length === 0 ? 'Add a tag...' : ''}
          className="flex-grow outline-none bg-transparent min-w-[100px]"
        />
      </div>
    </div>
  );
};

export default InterestsStep;
