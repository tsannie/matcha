import { useState } from 'react';
import RangeSlider from './ui/RangeSlider';

const COMMON_TAGS = [
  'vegan', 'geek', 'piercing', 'travel', 'sports', 'music',
  'art', 'cooking', 'gaming', 'reading', 'hiking', 'yoga',
  'photography', 'movies', 'dance', 'fitness'
];

const FilterSidebar = ({ filters, setFilters }) => {
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const handleRangeChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFilter = (field) => {
    setFilters((prev) => ({
      ...prev,
      active: { ...prev.active, [field]: !prev.active[field] },
    }));
  };

  const addTag = (tag) => {
    if (tag && !filters.tags.includes(tag.toLowerCase())) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.toLowerCase()],
      }));
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const filteredSuggestions = COMMON_TAGS.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !filters.tags.includes(tag)
  );

  return (
    <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-200 h-fit flex-shrink-0 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary1 to-primary3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          Filters
        </h2>
      </div>

      <div className="p-6 space-y-6">
        <RangeSlider
          label="Age"
          min={18}
          max={99}
          value={filters.age}
          onChange={(val) => handleRangeChange('age', val)}
          enabled={filters.active.age}
          onToggle={() => toggleFilter('age')}
        />

        <RangeSlider
          label="Fame Rating"
          min={0}
          max={1000}
          value={filters.fame}
          onChange={(val) => handleRangeChange('fame', val)}
          enabled={filters.active.fame}
          onToggle={() => toggleFilter('fame')}
        />

        <RangeSlider
          label="Distance (Km)"
          min={0}
          max={500}
          value={[0, filters.distance]}
          onChange={(val) => setFilters((prev) => ({ ...prev, distance: val[1] }))}
          enabled={filters.active.distance}
          onToggle={() => toggleFilter('distance')}
        />

        {/* Tags Filter */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex gap-3 items-center mb-4">
            <input
              type="checkbox"
              checked={filters.active.tags}
              onChange={() => toggleFilter('tags')}
              className="w-5 h-5 rounded border-gray-300 text-primary1 focus:ring-primary1 cursor-pointer"
            />
            <label className="font-medium text-gray-700 text-sm cursor-pointer" onClick={() => toggleFilter('tags')}>
              Interest Tags
            </label>
          </div>

          {filters.active.tags && (
            <div className="space-y-3 pl-8">
              {/* Selected Tags */}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-primary1/10 text-primary1 text-xs rounded-full flex items-center gap-1.5 border border-primary1/20 font-medium"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput) {
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Type a tag..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary1 focus:ring-2 focus:ring-primary1/20 transition-all"
                />

                {/* Tag Suggestions */}
                {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map(tag => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="w-full text-left px-3 py-2.5 hover:bg-primary1/5 text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-primary1 font-medium">#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
