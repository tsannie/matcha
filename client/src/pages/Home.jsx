import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import FilterSidebar from '../components/FilterSidebar';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [filters, setFilters] = useState({
    age: [18, 50],
    fame: [0, 100],
    distance: 50,
    active: {
      age: true,
      fame: true,
      distance: true,
      tags: false,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) return;

    const fetchProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const res = await api.get('/browsing/recommendations');
        setProfiles(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    if (user) fetchProfiles();
  }, [user, authLoading]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (filters.active.age && (p.age < filters.age[0] || p.age > filters.age[1])) return false;
      if (filters.active.fame && (p.fame_rating < filters.fame[0] || p.fame_rating > filters.fame[1])) return false;
      if (filters.active.distance && (p.distance || 0) > filters.distance) return false;
      return true;
    });
  }, [profiles, filters]);

  if (authLoading) return null;

  return (
    <div className="w-full bg-bg px-4 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center max-w-[1600px] mx-auto">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div className="flex-grow w-full">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-primary1">Discover</h1>
            <p className="text-gray-500 text-sm">{filteredProfiles.length} profiles found around you</p>
          </div>
        </div>

        {loadingProfiles ? (
          <div className="text-center py-20 animate-pulse text-gray-400">Loading profiles...</div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} user={profile} />
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
