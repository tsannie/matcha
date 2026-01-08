import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const RangeSlider = ({ label, min, max, value, onChange, enabled, onToggle }) => {
  return (
    <div className={`transition-all duration-200`}>
      <div className="flex gap-3 items-center">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-primary1 focus:ring-primary1 cursor-pointer transition-all"
        />
        <label className="font-medium text-gray-700 text-sm cursor-pointer select-none" onClick={onToggle}>
          {label}
        </label>
      </div>

      {enabled && (
        <div className="space-y-3 animate-fadeIn mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[60px]">
              <span className="text-xs text-gray-500 font-medium">Min:</span>
              <span className="text-sm font-semibold text-primary1 bg-primary1/5 px-2 py-1 rounded-md">{value[0]}</span>
            </div>

            <div className="flex-grow px-2 py-1">
              <Slider
                range
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                styles={{
                  track: {
                    backgroundColor: '#00a699',
                    height: 6,
                  },
                  handle: {
                    borderColor: '#00a699',
                    backgroundColor: '#fff',
                    opacity: 1,
                    boxShadow: '0 2px 8px rgba(233, 64, 87, 0.3)',
                    width: 18,
                    height: 18,
                  },
                  rail: {
                    backgroundColor: '#e5e7eb',
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-2 min-w-[60px]">
              <span className="text-xs text-gray-500 font-medium">Max:</span>
              <span className="text-sm font-semibold text-primary1 bg-primary1/5 px-2 py-1 rounded-md">{value[1]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
