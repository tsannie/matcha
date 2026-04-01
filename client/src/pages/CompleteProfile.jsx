import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AboutStep from '../components/profile-steps/AboutStep';
import InterestsStep from '../components/profile-steps/InterestsStep';
import PhotosStep from '../components/profile-steps/PhotosStep';
import LocationStep from '../components/profile-steps/LocationStep';
import { useAuth, checkProfileComplete } from '../context/AuthContext';
import { getLocationFromIP, reverseGeocode } from '../utils/geocoding';

const STEPS = [
  { id: 1, title: 'About You' },
  { id: 2, title: 'Interests' },
  { id: 3, title: 'Photos' },
  { id: 4, title: 'Location' },
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const completingRef = useRef(false);

  const [profile, setProfile] = useState({
    gender: '',
    sexual_preference: '',
    biography: '',
    tags: [],
    images: [],
    latitude: null,
    longitude: null,
    locationName: null,
  });

  useEffect(() => {
    if (user) {
      if (checkProfileComplete(user)) {
        navigate('/');
        return;
      }
      setProfile((prev) => ({ ...prev, ...user }));
    }
  }, [user, navigate]);

  const updateField = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const updateTags = (newTags) => {
    setProfile({ ...profile, tags: newTags });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const loadToast = toast.loading('Uploading...');
      const res = await api.post('/profile/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      const newImages = [...profile.images, res.data];
      setProfile((prev) => ({ ...prev, images: newImages }));
      updateUser({ images: newImages }); // Update Context

      toast.dismiss(loadToast);
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleDeletePhoto = async (imageId) => {
    try {
      // --- LOCATION ---

      await api.delete(`/profile/images/${imageId}`);
      const newImages = profile.images.filter((img) => img.id !== imageId);
      setProfile((prev) => ({ ...prev, images: newImages }));
      updateUser({ images: newImages }); // Update Context
      toast.success('Photo deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSetProfilePic = async (imageId) => {
    try {
      await api.put(`/profile/images/${imageId}/set-profile`);
      const newImages = profile.images.map((img) => ({ ...img, is_profile_picture: img.id === imageId }));
      setProfile((prev) => ({ ...prev, images: newImages }));
      updateUser({ images: newImages }); // Update Context
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleLocationChange = (latitude, longitude, locationName) => {
    setProfile((prev) => ({ ...prev, latitude, longitude, locationName }));
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return profile.gender && profile.sexual_preference && profile.biography?.trim();
    }
    if (currentStep === 2) {
      return profile.tags.length > 0;
    }
    if (currentStep === 3) {
      return profile.images.length > 0;
    }
    if (currentStep === 4) {
      return true; // Allow Finish — IP fallback handled in handleNext
    }
    return true;
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      if (currentStep === 1 || currentStep === 4) {
        let { latitude, longitude } = profile;

        // If no location chosen on last step, silently use IP geolocation
        if (currentStep === 4 && latitude === null) {
          const ipLoc = await getLocationFromIP();
          if (ipLoc) {
            const locationData = await reverseGeocode(ipLoc.lat, ipLoc.lon);
            latitude = ipLoc.lat;
            longitude = ipLoc.lon;
            const name = locationData?.shortName || `${ipLoc.lat.toFixed(4)}, ${ipLoc.lon.toFixed(4)}`;
            handleLocationChange(latitude, longitude, name);
          } else {
            setSaving(false);
            toast.error('Could not detect your location. Please enter it manually.');
            return;
          }
        }

        const payload = {
          gender: profile.gender,
          sexual_preference: profile.sexual_preference,
          biography: profile.biography,
          latitude,
          longitude,
        };
        const res = await api.put('/profile', payload);
        updateUser(res.data.user);
      }

      if (currentStep === 2) {
        await api.put('/profile/tags', { tags: profile.tags });
        updateUser({ tags: profile.tags });
      }

      setSaving(false);

      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        completingRef.current = true;
        toast.success('Profile completed!');
        navigate('/');
      }
    } catch (error) {
      setSaving(false);
      console.error(error);
      toast.error('Failed to save');
    }
  };

  if (authLoading) return <div className="flex justify-center p-10">Loading...</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
          Log out
        </button>
      </div>

      <Card className="w-full max-w-2xl min-h-[450px] flex flex-col">
        <div className="flex-grow">
          {currentStep === 1 && <AboutStep data={profile} onChange={updateField} />}
          {currentStep === 2 && <InterestsStep tags={profile.tags} setTags={updateTags} />}
          {currentStep === 3 && (
            <PhotosStep
              images={profile.images}
              onUpload={handleFileUpload}
              onDelete={handleDeletePhoto}
              onSetProfile={handleSetProfilePic}
            />
          )}
          {currentStep === 4 && (
            <LocationStep
              latitude={profile.latitude}
              longitude={profile.longitude}
              locationName={profile.locationName}
              onLocationChange={handleLocationChange}
              loading={saving}
            />
          )}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 px-2 pb-2">
          <Button
            secondary={true}
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || saving}
            className={currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}
          >
            Back
          </Button>

          <Button onClick={handleNext} loading={saving} disabled={!isStepValid()}>
            {currentStep === STEPS.length ? 'Finish' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CompleteProfile;
