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
    <div className="w-full md:w-80 p-6 bg-[#1a1a1a] text-white rounded-xl h-fit border border-gray-800 shadow-xl flex-shrink-0">
      <h2 className="text-xl font-bold mb-6 text-gray-200 border-b border-gray-700 pb-4">Filters</h2>

      <div className="space-y-8">
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
        <div>
          <div className="flex gap-4 items-center mb-3">
            <input
              type="checkbox"
              checked={filters.active.tags}
              onChange={() => toggleFilter('tags')}
              className="w-5 h-5 rounded"
            />
            <span className="block font-medium text-gray-300 text-sm">Interest Tags</span>
          </div>

          {filters.active.tags && (
            <div className="ml-9 space-y-3">
              {/* Selected Tags */}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary1/20 text-primary1 text-xs rounded-full flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400"
                      >
                        ×
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
                  placeholder="Add tag..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary1"
                />

                {/* Tag Suggestions */}
                {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded max-h-40 overflow-y-auto">
                    {filteredSuggestions.map(tag => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-300"
                      >
                        #{tag}
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
