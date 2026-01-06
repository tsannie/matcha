import React from 'react';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';

const AboutStep = ({ data, onChange }) => {
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const orientationOptions = [
    { value: 'heterosexual', label: 'Opposite Gender' },
    { value: 'homosexual', label: 'Same Gender' },
    { value: 'bisexual', label: 'Everyone (Bisexual)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">Tell us about yourself</h2>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="I am a..."
          value={data.gender || ''}
          onChange={(e) => onChange('gender', e.target.value)}
          options={genderOptions}
          placeholder="Select your gender"
          required
        />

        <Select
          label="Looking for..."
          value={data.sexual_preference || ''}
          onChange={(e) => onChange('sexual_preference', e.target.value)}
          options={orientationOptions}
          placeholder="Select preference"
          required
        />
      </div>

      <TextArea
        label="Biography"
        value={data.biography || ''}
        onChange={(e) => onChange('biography', e.target.value)}
        placeholder="Write a few lines about what you like..."
        maxLength={500}
        required
      />
    </div>
  );
};

export default AboutStep;
