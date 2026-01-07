import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import FilterSidebar from '../components/FilterSidebar';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../context/AuthContext';
import Select from '../components/ui/Select';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [sortBy, setSortBy] = useState('smart');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const queryString = buildQueryParams();
      const res = await api.get(`/browsing/recommendations?${queryString}`);
      setProfiles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) return;
    if (user) fetchProfiles();
  }, [user, authLoading, filters, sortBy, sortOrder]);

  if (authLoading) return null;

  return (
    <div className="w-full bg-bg px-4 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center max-w-[1600px] mx-auto">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div className="flex-grow w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary1">Discover</h1>
            <p className="text-gray-500 text-sm">{profiles.length} profiles found</p>
          </div>

          <div className="flex gap-3 items-center">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-w-[160px]"
            >
              <option value="smart">Smart Match</option>
              <option value="age">Age</option>
              <option value="distance">Distance</option>
              <option value="fame">Fame Rating</option>
              <option value="tags">Common Tags</option>
            </Select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
        </div>

        {loadingProfiles ? (
          <div className="text-center py-20 animate-pulse text-gray-400">Loading profiles...</div>
        ) : profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} user={profile} onLikeChange={fetchProfiles} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-400 mb-2">No matches found 😢</p>
            <p className="text-sm text-gray-500">Try adjusting your filters to see more people.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
