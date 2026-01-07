import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import FilterSidebar from '../components/FilterSidebar';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../context/AuthContext';
import Select from '../components/ui/Select';

const Search = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [sortBy, setSortBy] = useState('fame');
  const [sortOrder, setSortOrder] = useState('desc');
  const [gender, setGender] = useState('');

  const [filters, setFilters] = useState({
    age: [18, 50],
    fame: [0, 100],
    distance: 50,
    tags: [],
    active: {
      age: false,
      fame: false,
      distance: false,
      tags: false,
    },
  });

  // Build query params from filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();

    params.append('sortBy', sortBy);
    params.append('order', sortOrder);

    if (gender) {
      params.append('gender', gender);
    }

    if (filters.active.age) {
      params.append('minAge', filters.age[0]);
      params.append('maxAge', filters.age[1]);
    }

    if (filters.active.fame) {
      params.append('minFame', filters.fame[0]);
      params.append('maxFame', filters.fame[1]);
    }

    if (filters.active.distance) {
      params.append('maxDistance', filters.distance);
    }

    if (filters.active.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    return params.toString();
  };

  const handleSearch = async () => {
    try {
      setLoadingProfiles(true);
      const queryString = buildQueryParams();
      const res = await api.get(`/browsing/search?${queryString}`);
      setProfiles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="w-full bg-bg px-4 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center max-w-[1600px] mx-auto">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div className="flex-grow w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary1 mb-4">Advanced Search</h1>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4 mb-6">
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="flex gap-4 items-end">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full"
                >
                  <option value="fame">Fame Rating</option>
                  <option value="age">Age</option>
                  <option value="distance">Distance</option>
                  <option value="tags">Common Tags</option>
                </Select>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="w-full bg-primary1 text-white py-3 rounded-lg font-medium hover:bg-primary1/90 transition-colors"
            >
              Search Profiles
            </button>
          </div>

          {/* Results Count */}
          {profiles.length > 0 && (
            <p className="text-gray-500 text-sm mb-4">{profiles.length} profiles found</p>
          )}
        </div>

        {/* Results */}
        {loadingProfiles ? (
          <div className="text-center py-20 animate-pulse text-gray-400">Searching...</div>
        ) : profiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} user={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-400 mb-2">No results yet</p>
            <p className="text-sm text-gray-500">Set your search criteria and click "Search Profiles"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
