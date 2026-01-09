const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Returns the full image URL.
 * If the path is already a full URL (http/https), returns it as-is.
 * Otherwise, prefixes with the API URL.
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL}${path}`;
};
