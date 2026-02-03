import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import FilterSidebar from '../components/FilterSidebar';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../context/AuthContext';
import Select from '../components/ui/Select';
import ArrowDownIcon from '../assets/icons/arrow-down.svg?react';
import ChevronLeftIcon from '../assets/icons/chevron-left.svg?react';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('smart');
  const [sortOrder, setSortOrder] = useState('desc');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const observerTarget = useRef(null);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      filters.tags.forEach((tag) => params.append('tags', tag));
    }

    return params.toString();
  };

  const fetchProfiles = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoadingProfiles(true);
      }

      const queryString = buildQueryParams();
      const currentOffset = isLoadMore ? offset : 0;
      const res = await api.get(`/browsing/recommendations?${queryString}&limit=24&offset=${currentOffset}`);

      if (isLoadMore) {
        setProfiles((prev) => [...prev, ...res.data]);
      } else {
        setProfiles(res.data);
        setOffset(24);
      }

      // Si on reçoit moins de 24 profils, c'est qu'il n'y en a plus
      setHasMore(res.data.length === 24);

      if (isLoadMore) {
        setOffset((prev) => prev + 24);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfiles(false);
      setLoadingMore(false);
    }
  };

  // Reset et recharge quand les filtres/tri changent
  useEffect(() => {
    if (!authLoading && !user) return;
    if (user) {
      setOffset(0);
      setProfiles([]);
      setHasMore(true);
      fetchProfiles(false);
    }
  }, [user, authLoading, filters, sortBy, sortOrder]);

  // Intersection Observer pour le scroll infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingProfiles) {
          fetchProfiles(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadingProfiles, offset]);

  // Update a single profile's like status locally (avoids refetching and scroll reset)
  const handleLikeChange = (userId, likedByMe, isMatch) => {
    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === userId ? { ...profile, liked_by_me: likedByMe, is_match: isMatch } : profile
      )
    );
  };

  if (authLoading) return null;

  return (
    <div className="w-full bg-bg px-4 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center max-w-[1600px] mx-auto">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div className="flex-grow w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary1">Discover</h1>
            <p className="text-gray-500 text-sm">
              {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
              {hasMore && profiles.length > 0 && ' (scroll for more)'}
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="min-w-[160px]">
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
                <ArrowDownIcon className="w-5 h-5" />
              ) : (
                <ArrowDownIcon className="w-5 h-5 rotate-180" />
              )}
            </button>
          </div>
        </div>

        {loadingProfiles ? (
          <div className="text-center py-20 animate-pulse text-gray-400">Loading profiles...</div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} user={profile} onLikeChange={handleLikeChange} />
              ))}
            </div>

            {/* Intersection Observer target */}
            <div ref={observerTarget} className="w-full py-8">
              {loadingMore && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary1"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading more profiles...</p>
                </div>
              )}
              {!hasMore && !loadingMore && (
                <div className="text-center text-gray-400 text-sm">You've seen all available profiles</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-400 mb-2">No matches found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters to see more people.</p>
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-primary1 text-white rounded-full shadow-lg hover:bg-primary1/90 transition-all duration-300 z-40 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronLeftIcon className="w-6 h-6 rotate-90" />
      </button>
    </div>
  );
};

export default Home;
