const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const getLocationFromIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return null;
    const data = await response.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lon: data.longitude };
    }
    return null;
  } catch {
    return null;
  }
};

const formatShortName = (item) => {
  const parts = [];

  if (item.address) {
    // Try to get the most relevant local name
    const localName =
      item.address.city ||
      item.address.town ||
      item.address.village ||
      item.address.municipality ||
      item.address.suburb ||
      item.address.neighbourhood;

    if (localName) parts.push(localName);

    // Add region/state if different from local name
    const region = item.address.state || item.address.region || item.address.county;
    if (region && region !== localName) parts.push(region);

    // Add country
    if (item.address.country) parts.push(item.address.country);
  }

  // Fallback to display_name if no address parts found
  if (parts.length === 0) {
    return item.display_name?.split(',').slice(0, 3).join(', ') || 'Unknown location';
  }

  return parts.join(', ');
};

export const searchLocation = async (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: limit.toString(),
    });

    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error('Nominatim search failed');
    }

    const data = await response.json();

    return data.map((item) => ({
      displayName: item.display_name,
      shortName: formatShortName(item),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error('Nominatim reverse geocode failed');
    }

    const data = await response.json();

    if (data.error) {
      return null;
    }

    return {
      displayName: data.display_name,
      shortName: formatShortName(data),
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
};
