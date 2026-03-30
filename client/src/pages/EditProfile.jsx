import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AboutStep from '../components/profile-steps/AboutStep';
import InterestsStep from '../components/profile-steps/InterestsStep';
import PhotosStep from '../components/profile-steps/PhotosStep';
import LocationStep from '../components/profile-steps/LocationStep';

const EditProfile = () => {
  const { user, updateUser } = useAuth();

  // Section states
  const [personalInfo, setPersonalInfo] = useState({
    gender: '',
    sexual_preference: '',
    biography: '',
  });
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    name: null,
  });

  // Loading states
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  // Initialize from user context
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        gender: user.gender || '',
        sexual_preference: user.sexual_preference || '',
        biography: user.biography || '',
      });
      setTags(user.tags || []);
      setImages(user.images || []);
      setLocation({
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        name: user.location_name || null,
      });
    }
  }, [user]);

  // VALIDATION FUNCTIONS

  const validatePersonalInfo = () => {
    if (!personalInfo.gender || !personalInfo.sexual_preference) {
      toast.error('Gender and sexual preference are required');
      return false;
    }

    if (!personalInfo.biography?.trim()) {
      toast.error('Biography is required');
      return false;
    }

    if (personalInfo.biography.length > 500) {
      toast.error('Biography must be 500 characters or less');
      return false;
    }

    return true;
  };

  // SECTION 1: PERSONAL INFO HANDLERS

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo({ ...personalInfo, [field]: value });
  };

  const handleSavePersonalInfo = async () => {
    if (!validatePersonalInfo()) return;

    setSavingPersonal(true);
    try {
      const payload = {
        gender: personalInfo.gender,
        sexual_preference: personalInfo.sexual_preference,
        biography: personalInfo.biography,
        latitude: user.latitude,
        longitude: user.longitude,
      };

      const res = await api.put('/profile', payload);
      updateUser(res.data.user);
      toast.success('Personal info updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    } finally {
      setSavingPersonal(false);
    }
  };

  // SECTION 2: INTERESTS HANDLERS

  const handleSaveTags = async () => {
    if (tags.length === 0) {
      toast.error('Add at least one tag');
      return;
    }

    setSavingTags(true);
    try {
      await api.put('/profile/tags', { tags });
      updateUser({ tags });
      toast.success('Interests updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tags');
    } finally {
      setSavingTags(false);
    }
  };

  // SECTION 3: PHOTOS HANDLERS

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

      const newImages = [...images, res.data];
      setImages(newImages);
      updateUser({ images: newImages });

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
      const newImages = images.filter((img) => img.id !== imageId);
      setImages(newImages);
      updateUser({ images: newImages });
      toast.success('Photo deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleSetProfilePic = async (imageId) => {
    try {
      await api.put(`/profile/images/${imageId}/set-profile`);
      const newImages = images.map((img) => ({
        ...img,
        is_profile_picture: img.id === imageId,
      }));
      setImages(newImages);
      updateUser({ images: newImages });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    }
  };

  // SECTION 4: LOCATION HANDLERS

  const handleLocationUpdate = (latitude, longitude, name) => {
    setLocation({ latitude, longitude, name });
  };

  const handleSaveLocation = async () => {
    if (location.latitude === null || location.longitude === null) {
      toast.error('Please set your location first');
      return;
    }

    setSavingLocation(true);
    try {
      const payload = {
        gender: user.gender,
        sexual_preference: user.sexual_preference,
        birthdate: user.birthdate,
        biography: user.biography,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const res = await api.put('/profile', payload);
      updateUser(res.data.user);
      toast.success('Location updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update location');
    } finally {
      setSavingLocation(false);
    }
  };

  // RENDER

  if (!user) {
    return <div className="flex justify-center p-10">Loading...</div>;
  }

  return (
    <React.Fragment>
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>

        {/* ACCOUNT INFO (READ-ONLY) */}
        <Card title="Account Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'First Name', value: user.firstname },
              { label: 'Last Name', value: user.lastname },
              { label: 'Email', value: user.email },
              {
                label: 'Birthdate',
                value: user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'Not set',
              },
            ].map((field, index) => (
              <div key={index}>
                <label className="block text-gray-500 mb-1">{field.label}</label>
                <p className="font-medium text-gray-900">{field.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Personal Information">
          <div className="space-y-4">
            <AboutStep data={personalInfo} onChange={handlePersonalInfoChange} />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSavePersonalInfo} loading={savingPersonal}>
                Save Personal Info
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Interests">
          <div className="space-y-4">
            <InterestsStep tags={tags} setTags={setTags} />
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveTags} loading={savingTags}>
                Save Interests
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Photos">
          <PhotosStep
            images={images}
            onUpload={handleFileUpload}
            onDelete={handleDeletePhoto}
            onSetProfile={handleSetProfilePic}
          />
        </Card>

        <Card title="Location">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Set your location to find matches near you.</p>

            <LocationStep
              latitude={location.latitude}
              longitude={location.longitude}
              locationName={location.name}
              onLocationChange={handleLocationUpdate}
              loading={savingLocation}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveLocation} loading={savingLocation}>
                Save Location
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default EditProfile;
