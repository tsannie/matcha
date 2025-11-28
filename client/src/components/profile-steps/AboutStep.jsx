const AboutStep = ({ data, onChange }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">Tell us about yourself</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">I am a...</label>
          <select
            value={data.gender || 'male'}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary1 outline-none bg-white"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Looking for...</label>
          <select
            value={data.sexual_preference || 'bisexual'}
            onChange={(e) => onChange('sexual_preference', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary1 outline-none bg-white"
          >
            <option value="bisexual">Everyone (Bisexual)</option>
            <option value="heterosexual">Opposite Gender</option>
            <option value="homosexual">Same Gender</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Biography</label>
        <textarea
          value={data.biography || ''}
          onChange={(e) => onChange('biography', e.target.value)}
          placeholder="Write a few lines about what you like..."
          rows="5"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary1 outline-none resize-none"
        />
        <div className="text-right text-xs text-gray-400 mt-1">{(data.biography || '').length}/500</div>
      </div>
    </div>
  );
};

export default AboutStep;
