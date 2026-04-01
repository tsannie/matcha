import { useState, useEffect, useRef } from 'react';
import { searchLocation, reverseGeocode, getLocationFromIP } from '../../utils/geocoding';
import SpinnerIcon from '../../assets/icons/spinner.svg?react';

const LocationStep = ({ latitude, longitude, locationName, onLocationChange, loading }) => {
  const [mode, setMode] = useState(null); // null | 'gps' | 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const debounceRef = useRef(null);
  const hasLocation = latitude !== null && longitude !== null;

  // Reset mode when location is cleared externally
  useEffect(() => {
    if (!hasLocation) {
      setMode(null);
      setSearchQuery('');
      setSuggestions([]);
      setGpsError(null);
    }
  }, [hasLocation]);

  // Debounced search
  useEffect(() => {
    if (mode !== 'manual' || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchLocation(searchQuery, 5);
      setSuggestions(results);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, mode]);

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setMode('manual');
      return;
    }

    setMode('gps');
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;

        // Reverse geocode to get location name
        const locationData = await reverseGeocode(lat, lon);
        const name = locationData?.shortName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        onLocationChange(lat, lon, name);
        setGpsLoading(false);
      },
      (error) => {
        // Keep gpsLoading true while trying IP fallback silently
        const tryIPFallback = async () => {
          const ipLocation = await getLocationFromIP();
          if (ipLocation) {
            const locationData = await reverseGeocode(ipLocation.lat, ipLocation.lon);
            const name = locationData?.shortName || `${ipLocation.lat.toFixed(4)}, ${ipLocation.lon.toFixed(4)}`;
            onLocationChange(ipLocation.lat, ipLocation.lon, name);
          } else {
            let errorMessage = 'Unable to retrieve your location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enter your location manually.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please enter manually.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again or enter manually.';
                break;
            }
            setGpsError(errorMessage);
            setMode('manual');
          }
          setGpsLoading(false);
        };

        tryIPFallback();
      },
    );
  };

  const handleManualClick = () => {
    setMode('manual');
    setGpsError(null);
  };

  const handleSuggestionClick = (suggestion) => {
    onLocationChange(suggestion.latitude, suggestion.longitude, suggestion.shortName);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleModifyLocation = () => {
    onLocationChange(null, null, null);
  };

  // Location is set - show confirmation
  if (hasLocation && !gpsLoading) {
    return (
      <div className="space-y-6 text-center pt-8 animate-fade-in min-h-[320px]">
        <h2 className="text-xl font-semibold text-gray-700">Location Set</h2>

        <div className="flex justify-center my-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-300">
            <span className="text-3xl">✓</span>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
          <p className="text-green-700 font-medium flex items-center justify-center gap-2">
            <span>📍</span>
            {locationName || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleModifyLocation}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 text-sm underline transition"
        >
          Back to options
        </button>
      </div>
    );
  }

  // Initial state or after clicking modify - show options
  if (mode === null) {
    return (
      <div className="space-y-6 text-center pt-8 animate-fade-in min-h-[320px]">
        <h2 className="text-xl font-semibold text-gray-700">Where are you located?</h2>
        <p className="text-gray-500">We need your location to suggest matches near you.</p>

        <div className="flex justify-center my-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-primary1/20">
            <span className="text-4xl">📍</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
          <button
            onClick={handleGpsClick}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span>📍</span> Share my location
          </button>

          <button
            onClick={handleManualClick}
            disabled={loading}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition flex items-center justify-center gap-2 font-medium"
          >
            <span>✏️</span> Enter manually
          </button>
        </div>
      </div>
    );
  }

  // GPS loading state
  if (mode === 'gps' && gpsLoading) {
    return (
      <div className="space-y-6 text-center pt-8 animate-fade-in min-h-[320px]">
        <h2 className="text-xl font-semibold text-gray-700">Getting your location...</h2>

        <div className="flex justify-center my-8">
          <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-200 animate-pulse">
            <span className="text-4xl">📍</span>
          </div>
        </div>

        <p className="text-gray-500">Please allow location access when prompted.</p>
      </div>
    );
  }

  // Manual mode - show search
  if (mode === 'manual') {
    return (
      <div className="space-y-6 pt-8 animate-fade-in min-h-[320px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Enter your location</h2>
          <p className="text-gray-500 mt-1">Search for your city or neighborhood</p>
        </div>

        {gpsError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">{gpsError}</div>
        )}

        <div className="relative max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Paris, London, New York..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoFocus
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <SpinnerIcon className="animate-spin h-5 w-5 text-gray-400" />
              </span>
            )}
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-start gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-400 mt-0.5">📍</span>
                    <div>
                      <p className="font-medium text-gray-800">{suggestion.shortName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[250px]">{suggestion.displayName}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQuery.length >= 2 && !searching && suggestions.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-4">No locations found. Try a different search term.</p>
          )}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => setMode(null)}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition"
          >
            Back to options
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LocationStep;
