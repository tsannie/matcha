import React from 'react';
import Button from '../ui/Button';
import { getImageUrl } from '../../utils/image';
import plusIcon from '../../assets/icons/plus.svg';

const PhotosStep = ({ images, onUpload, onDelete, onSetProfile }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">
          Your Photos<span className="text-red-500 ml-1">*</span>
        </h2>
        <span className="text-sm text-gray-500">{images.length}/5</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`
              relative group aspect-square rounded-xl overflow-hidden border-2 transition-all
              ${img.is_profile_picture ? 'border-primary1 shadow-md' : 'border-transparent bg-gray-100'}
            `}
          >
            <img src={getImageUrl(img.file_path)} alt="User content" className="w-full h-full object-cover" />

            {img.is_profile_picture && (
              <div className="absolute top-2 left-2 bg-primary1 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                MAIN
              </div>
            )}

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
              {!img.is_profile_picture && (
                <Button
                  onClick={() => onSetProfile(img.id)}
                  secondary={true}
                  className="px-3 py-1 text-xs w-full bg-white text-gray-900 hover:bg-gray-100 border-none"
                >
                  Make Profile
                </Button>
              )}

              <Button
                onClick={() => onDelete(img.id)}
                className="px-3 py-1 text-xs w-full bg-red-500 hover:bg-red-600 text-white border-none"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}

        {images.length < 5 && (
          <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary1 hover:bg-primary1/5 transition-colors aspect-square group">
            <div className="p-4 bg-gray-100 rounded-full mb-2 group-hover:bg-white group-hover:scale-110 transition-transform">
              <img src={plusIcon} alt="" className="h-6 w-6 opacity-40 group-hover:opacity-100" />
            </div>
            <span className="text-sm font-medium text-gray-500 group-hover:text-primary1">Add Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotosStep;
