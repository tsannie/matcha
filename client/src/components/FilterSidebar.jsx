import RangeSlider from './ui/RangeSlider';

const FilterSidebar = ({ filters, setFilters }) => {
  const handleRangeChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFilter = (field) => {
    setFilters((prev) => ({
      ...prev,
      active: { ...prev.active, [field]: !prev.active[field] },
    }));
  };

  return (
    <div className="w-full md:w-80 p-6 bg-[#1a1a1a] text-white rounded-xl h-fit border border-gray-800 shadow-xl flex-shrink-0">
      <h2 className="text-xl font-bold mb-6 text-gray-200 border-b border-gray-700 pb-4">Match With:</h2>

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
          label="Location (Km)"
          min={0}
          max={500}
          value={[0, filters.distance]} // Astuce: slider range pour avoir 0 à gauche fixe visuellement
          onChange={(val) => setFilters((prev) => ({ ...prev, distance: val[1] }))} // On ne garde que la valeur max
          enabled={filters.active.distance}
          onToggle={() => toggleFilter('distance')}
        />

        {/* Tags (Checkbox simple pour l'instant comme sur ton image) */}
        <div className="flex gap-4 items-center opacity-50 cursor-not-allowed">
          <div className="pt-1">
            <input type="checkbox" disabled className="w-5 h-5 rounded" />
          </div>
          <span className="block font-medium text-gray-300 text-sm">Tags (Coming soon)</span>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
