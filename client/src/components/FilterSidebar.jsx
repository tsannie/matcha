import { useEffect, useState } from 'react';
import RangeSlider from './ui/RangeSlider';
import slidersIcon from '../assets/icons/sliders.svg';
import TagIcon from '../assets/icons/tag.svg?react';

const COMMON_TAGS = [
  'vegan',
  'geek',
  'piercing',
  'travel',
  'sports',
  'music',
  'art',
  'cooking',
  'gaming',
  'reading',
  'hiking',
  'yoga',
  'photography',
  'movies',
  'dance',
  'fitness',
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
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const filteredSuggestions = COMMON_TAGS.filter(
    (tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !filters.tags.includes(tag)
  );

  const activeFiltersCount = Object.values(filters.active).filter(Boolean).length;

  useEffect(() => {
    if (!filters.active.tags) {
      setFilters((prev) => ({ ...prev, tags: [] }));
    }
  }, [filters.active.tags, setFilters]);

  return (
    <div className="w-full md:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 h-fit flex-shrink-0 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="p-6 bg-primary1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"></div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <img src={slidersIcon} alt="" className="w-5 h-5 invert" />
            </div>
            <h2 className="text-xl font-bold text-white">Filters</h2>
          </div>

          {activeFiltersCount > 0 && (
            <div className="bg-white text-primary1 text-xs font-bold px-2.5 py-1 rounded-full">
              {activeFiltersCount}
            </div>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <div className="p-6 space-y-5">
        {/* Age Filter */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-primary1/30 transition-colors">
          <RangeSlider
            label="Age Range"
            min={18}
            max={99}
            value={filters.age}
            onChange={(val) => handleRangeChange('age', val)}
            enabled={filters.active.age}
            onToggle={() => toggleFilter('age')}
          />
        </div>

        {/* Fame Filter */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-primary1/30 transition-colors">
          <RangeSlider
            label="Fame Rating"
            min={0}
            max={1000}
            value={filters.fame}
            onChange={(val) => handleRangeChange('fame', val)}
            enabled={filters.active.fame}
            onToggle={() => toggleFilter('fame')}
          />
        </div>

        {/* Distance Filter */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-primary1/30 transition-colors">
          <RangeSlider
            label="Distance (km)"
            min={0}
            max={500}
            value={[0, filters.distance]}
            onChange={(val) => setFilters((prev) => ({ ...prev, distance: val[1] }))}
            enabled={filters.active.distance}
            onToggle={() => toggleFilter('distance')}
          />
        </div>

        {/* Tags Filter */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-primary1/30 transition-colors">
          <div className="flex gap-3 items-center mb-4">
            <input
              type="checkbox"
              checked={filters.active.tags}
              onChange={() => toggleFilter('tags')}
              className="w-5 h-5 rounded border-gray-300 text-primary1 focus:ring-primary1 cursor-pointer transition-all"
            />
            <label
              className="font-medium text-gray-700 text-sm cursor-pointer select-none flex-grow"
              onClick={() => toggleFilter('tags')}
            >
              Interest Tags
            </label>
            {filters.tags.length > 0 && (
              <span className="bg-primary1/10 text-primary1 text-xs font-bold px-2 py-1 rounded-full">
                {filters.tags.length}
              </span>
            )}
          </div>

          {filters.active.tags && (
            <div className="space-y-3 pl-8 animate-fadeIn">
              {/* Tag Input */}
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput) {
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add a tag..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary1 focus:ring-2 focus:ring-primary1/20 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <TagIcon className="w-5 h-5" />
                  </div>
                </div>

                {/* Tag Suggestions */}
                {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-fadeIn">
                    {filteredSuggestions.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-primary1/5 hover:to-primary3/5 text-sm text-gray-700 transition-all border-b border-gray-50 last:border-b-0 flex items-center gap-2 group"
                      >
                        <span className="text-primary1 font-semibold group-hover:scale-110 transition-transform">
                          #{tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white rounded-lg border border-primary1/10">
                    {filters.tags.map((tag) => (
                      <span
                        key={tag}
                        className="group px-3 py-1.5 bg-gradient-to-r from-primary1/10 to-primary3/10 text-primary1 text-xs rounded-full flex items-center gap-1.5 border border-primary1/20 font-medium hover:border-primary1/40 transition-all"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:bg-red-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition-all text-xs"
                          aria-label={`Remove ${tag}`}
                        >
                          ✕
                        </button>
                      </span>
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
