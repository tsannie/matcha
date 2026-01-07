import Card from './ui/Card';
import Button from './ui/Button'; // Assure-toi d'avoir importé Button
import { useState } from 'react';

const ProfileCard = ({ user }) => {
  const [liked, setLiked] = useState(false); // État local pour l'UI immédiate

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Call api
    console.log(liked ? 'Unliked' : 'Liked', user.username);
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col p-0 relative group hover:scale-[1.02]">
      <div className="relative h-80 w-full bg-gray-200">
        <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white">
          <h3 className="text-2xl font-bold">
            {user.firstname}, {user.age}
          </h3>
          <p className="text-sm opacity-90 mt-1">@{user.username}</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 flex-grow flex flex-col gap-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {user.tags &&
            user.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-primary3/10 text-primary1 text-xs rounded-full font-medium border border-primary3/20"
              >
                #{tag}
              </span>
            ))}
        </div>

        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{user.biography || 'No biography.'}</p>

        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-base">⭐</span> {user.fame_rating}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-base">📍</span> {user.distance ? `${Math.round(user.distance)} km` : '? km'}
          </span>
        </div>

        <div className="mt-3">
          <Button
            onClick={handleLike}
            className={`w-full flex items-center justify-center gap-2 transition-all py-3 ${
              liked ? 'bg-pink-100 text-pink-600 border-pink-200 hover:bg-pink-200' : 'bg-primary1 text-white'
            }`}
          >
            {liked ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            )}
            {liked ? 'Liked' : 'Like'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;
