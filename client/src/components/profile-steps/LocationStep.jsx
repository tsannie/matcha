const LocationStep = ({ latitude, longitude, onLocate, loading }) => {
  return (
    <div className="space-y-6 text-center pt-8 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">Where are you?</h2>
      <p className="text-gray-500">We need your location to suggest matches near you.</p>

      <div className="flex justify-center my-8">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-primary1/20">
          <span className="text-4xl">📍</span>
        </div>
      </div>

      {latitude ? (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 inline-block">
          <p className="text-green-700 font-medium">Location Acquired!</p>
          <p className="text-xs text-green-600 mt-1">
            Lat: {Number(latitude).toFixed(4)}, Long: {Number(longitude).toFixed(4)}
          </p>
        </div>
      ) : (
        <button
          onClick={onLocate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition flex items-center gap-2 mx-auto font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          {loading ? 'Locating...' : '📍 Use Current Location'}
        </button>
      )}
    </div>
  );
};

export default LocationStep;
