import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import api from '../api/axios';

// Import des sous-composants
import AboutStep from '../components/profile-steps/AboutStep';
import InterestsStep from '../components/profile-steps/InterestsStep';
import PhotosStep from '../components/profile-steps/PhotosStep';
import LocationStep from '../components/profile-steps/LocationStep';

const STEPS = [
  { id: 1, title: 'About You' },
  { id: 2, title: 'Interests' },
  { id: 3, title: 'Photos' },
  { id: 4, title: 'Location' },
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // State Global
  const [profile, setProfile] = useState({
    gender: '',
    sexual_preference: '',
    biography: '',
    tags: [],
    images: [],
    latitude: null,
    longitude: null,
  });

  // Fetch initial
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile((prev) => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  // --- ACTIONS GLOBALES ---

  const updateField = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const updateTags = (newTags) => {
    setProfile({ ...profile, tags: newTags });
  };

  // --- ACTIONS PHOTOS (API Calls directs) ---

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const loadToast = toast.loading('Uploading...');
      const res = await api.post('/profile/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => ({ ...prev, images: [...prev.images, res.data] }));
      toast.dismiss(loadToast);
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleDeletePhoto = async (imageId) => {
    try {
      await api.delete(`/profile/images/${imageId}`);
      setProfile((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
      toast.success('Photo deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleSetProfilePic = async (imageId) => {
    try {
      await api.put(`/profile/images/${imageId}/set-profile`);
      setProfile((prev) => ({
        ...prev,
        images: prev.images.map((img) => ({
          ...img,
          is_profile_picture: img.id === imageId,
        })),
      }));
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update profile picture');
    }
  };

  // --- ACTIONS LOCATION ---

  const handleLocateMe = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfile({
          ...profile,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        toast.success('Location found!');
      },
      (error) => {
        setLoading(false);
        toast.error('Unable to retrieve location.');
        console.error(error);
      }
    );
  };

  // --- NAVIGATION (Next/Back) ---

  const handleNext = async () => {
    try {
      setLoading(true);

      if (currentStep === 1 || currentStep === 4) {
        console.log('Updating profile info...');
        console.log(profile);
        console.log('step:', currentStep);
        await api.put('/profile/', {
          gender: profile.gender,
          sexual_preference: profile.sexual_preference,
          biography: profile.biography,
          latitude: profile.latitude,
          longitude: profile.longitude,
        });
      }

      if (currentStep === 2) {
        if (profile.tags.length === 0) {
          toast.error('Please add at least one interest tag.');
          setLoading(false);
          return;
        }
        await api.put('/profile/tags', { tags: profile.tags });
      }

      if (currentStep === 3 && profile.images.length === 0) {
        toast.error('You must upload at least one photo.');
        setLoading(false);
        return;
      }

      setLoading(false);

      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.success('Profile completed! Welcome to Matcha.');
        navigate('/');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error('Failed to save progress.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 px-4">
      {/* HEADER / PROGRESS */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-3xl font-bold text-primary1 text-center mb-6">Complete your Profile</h1>
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary1 -z-10 rounded transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center bg-bg px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  step.id <= currentStep ? 'bg-primary1 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <span
                className={`text-xs mt-2 ${step.id <= currentStep ? 'text-primary1 font-medium' : 'text-gray-400'}`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-primary3/30 min-h-[450px] flex flex-col">
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
              onLocate={handleLocateMe}
              loading={loading}
            />
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || loading}
            className={`px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-2 bg-primary1 text-white font-bold rounded-lg hover:bg-hover shadow-md hover:shadow-lg transform transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Saving...' : currentStep === STEPS.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
