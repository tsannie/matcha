import Button from './Button';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import HeartIcon from '../../assets/icons/heart-outline.svg?react';

const LikeButton = ({ userId, likedByMe, onLikeChange, className = '' }) => {
  const handleLike = async () => {
    try {
      if (likedByMe) {
        await api.delete(`/likes/${userId}`);
        toast.success('Unliked');
        if (onLikeChange) {
          onLikeChange(false, false);
        }
      } else {
        const { data } = await api.post(`/likes/${userId}`);
        if (data.isMatch) {
          toast.success("It's a match! 💕", { duration: 4000 });
        } else {
          toast.success('Liked! 💖');
        }
        if (onLikeChange) {
          onLikeChange(true, data.isMatch);
        }
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 403) {
        toast.error(error.response.data.error || 'You need a profile picture to like others');
      } else {
        toast.error(error.response?.data?.error || 'Failed to like');
      }
    }
  };

  return (
    <Button
      onClick={handleLike}
      className={`flex items-center justify-center gap-2 transition-all ${
        likedByMe ? 'hover:bg-pink-400' : 'bg-primary1 text-white'
      } ${className}`}
    >
      {likedByMe ? <HeartIcon className="w-5 h-5 fill-white" /> : <HeartIcon className="w-5 h-5" />}
      {likedByMe ? 'Liked' : 'Like'}
    </Button>
  );
};

export default LikeButton;
