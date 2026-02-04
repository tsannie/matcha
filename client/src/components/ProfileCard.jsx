import Card from './ui/Card';
import LikeButton from './ui/LikeButton';
import { getImageUrl } from '../utils/image';

const ProfileCard = ({ user, onLikeChange, onProfileClick }) => {
  const handleLikeChange = (liked, isMatch) => {
    if (onLikeChange) {
      onLikeChange(user.id, liked, isMatch);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col p-0 relative group hover:scale-[1.02]">
      <div
        onClick={() => onProfileClick?.(user.id)}
        className="flex-grow flex flex-col cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onProfileClick?.(user.id);
          }
        }}
      >
        <div className="relative h-80 w-full bg-gray-200">
          <img src={getImageUrl(user.profile_picture)} alt={user.username} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white">
            <h3 className="text-2xl font-bold">
              {user.firstname}, {user.age}
            </h3>
            <p className="text-sm opacity-90 mt-1">@{user.username}</p>
          </div>
        </div>

        {/* Contenu */}
        {user.is_match && (
          <span className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">Match!</span>
        )}
        <div className="py-5 flex-grow flex flex-col gap-3">
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
        </div>
      </div>

      <div className="px-5">
        <LikeButton
          userId={user.id}
          likedByMe={user.liked_by_me}
          onLikeChange={handleLikeChange}
          className="w-full py-3"
        />
      </div>
    </Card>
  );
};

export default ProfileCard;
