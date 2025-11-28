const PhotosStep = ({ images, onUpload, onDelete, onSetProfile }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Your Photos</h2>
        <span className="text-sm text-gray-500">{images.length}/5</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
              img.is_profile_picture ? 'border-primary1' : 'border-transparent'
            }`}
          >
            <img src={`http://localhost:5000${img.file_path}`} alt="User" className="w-full h-full object-cover" />

            {img.is_profile_picture && (
              <div className="absolute top-2 left-2 bg-primary1 text-white text-[10px] px-2 py-0.5 rounded shadow">
                Main
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {!img.is_profile_picture && (
                <button
                  onClick={() => onSetProfile(img.id)}
                  className="text-xs bg-white text-gray-800 px-3 py-1 rounded hover:bg-primary1 hover:text-white transition"
                >
                  Make Profile
                </button>
              )}
              <button
                onClick={() => onDelete(img.id)}
                className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {images.length < 5 && (
          <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary1 hover:bg-primary1/5 transition aspect-square">
            <span className="text-3xl text-gray-400">+</span>
            <span className="text-sm text-gray-500 mt-2">Upload</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotosStep;
