import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Badge from '../ui/Badge';

const InterestsStep = ({ tags, setTags }) => {
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const MAX_TAGS = 10;
  const isMaxReached = tags.length >= MAX_TAGS;

  useEffect(() => {
    api.get('/profile/tags').then((res) => setAvailableTags(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = tagInput
    ? availableTags
        .filter((t) => t.startsWith(tagInput) && !tags.includes(t))
        .slice(0, 8)
    : [];

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (val.length > 20) return;
    val = val.replace(/[^a-zA-Z0-9-]/g, '');
    setTagInput(val.toLowerCase());
    setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = (value) => {
    const val = (value || tagInput).trim();
    if (!val) return;

    if (val.length < 2) return toast.error('Tag too short (min 2 chars)');
    if (tags.includes(val)) {
      setTagInput('');
      return toast.error('Tag already added');
    }

    if (isMaxReached) return toast.error(`Max ${MAX_TAGS} tags allowed`);

    setTags([...tags, val]);
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">
        Your Interests<span className="text-red-500 ml-1">*</span>
      </h2>
      <p className="text-gray-500 text-sm">Type a tag and press Space or Enter (ex: vegan, geek, gym...)</p>

      <div ref={wrapperRef} className="relative">
        <div
          className={`
            border p-3 rounded-lg flex flex-wrap gap-2 items-center min-h-[50px] transition-all
            ${
              isMaxReached
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 focus-within:ring-2 focus-within:ring-primary1'
            }
          `}
        >
          {tags.map((tag, idx) => (
            <Badge key={idx} onRemove={() => removeTag(tag)}>
              #{tag}
            </Badge>
          ))}

          <input
            type="text"
            value={tagInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 150);
              addTag();
            }}
            onFocus={() => tagInput && setShowSuggestions(true)}
            disabled={isMaxReached}
            className={`
              flex-grow outline-none bg-transparent min-w-[80px] py-1 text-sm
              ${isMaxReached ? 'cursor-not-allowed placeholder-red-400' : 'placeholder-gray-400'}
            `}
            placeholder={
              isMaxReached ? `Limit reached (${MAX_TAGS}/${MAX_TAGS})` : tags.length === 0 ? 'Add a tag...' : ''
            }
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary1/10 text-gray-700 cursor-pointer"
              >
                #{s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`text-right text-xs ${isMaxReached ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        {tags.length}/{MAX_TAGS} tags
      </div>
    </div>
  );
};

export default InterestsStep;
