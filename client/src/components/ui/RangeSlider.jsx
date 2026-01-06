import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const RangeSlider = ({ label, min, max, value, onChange, enabled, onToggle }) => {
  return (
    <div className={`flex gap-4 items-start ${!enabled ? 'opacity-50' : ''}`}>
      <div className="pt-1">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="w-5 h-5 accent-primary1 rounded cursor-pointer"
        />
      </div>

      <div className="flex-grow space-y-2">
        <span className="block font-medium text-gray-300 text-sm">{label}</span>

        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm border-b border-gray-600 pb-1 min-w-[30px] text-center">
            {value[0]}
          </span>

          <div className="flex-grow pt-1">
            <Slider
              range
              min={min}
              max={max}
              value={value}
              onChange={enabled ? onChange : undefined}
              disabled={!enabled}
              styles={{
                track: { backgroundColor: enabled ? '#E94057' : '#555' },
                handle: {
                  borderColor: enabled ? '#E94057' : '#555',
                  backgroundColor: '#1a1a1a',
                  opacity: 1,
                },
                rail: { backgroundColor: '#4b5563' },
              }}
              // ------------------------
            />
          </div>

          <span className="text-white font-mono text-sm border-b border-gray-600 pb-1 min-w-[30px] text-center">
            {value[1]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
