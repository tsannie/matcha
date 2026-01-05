import { useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';

const InterestsStep = ({ tags, setTags }) => {
  const [tagInput, setTagInput] = useState('');
  const MAX_TAGS = 10;
  const isMaxReached = tags.length >= MAX_TAGS;

  // 1. GESTION DE LA SAISIE
  const handleInputChange = (e) => {
    let val = e.target.value;
    if (val.length > 20) return;
    val = val.replace(/[^a-zA-Z0-9-]/g, ''); // Uniquement lettres, chiffres, tirets
    setTagInput(val.toLowerCase());
  };

  // 2. GESTION DE LA VALIDATION
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (!val) return;

    if (val.length < 2) return toast.error('Tag too short (min 2 chars)');
    if (tags.includes(val)) {
      setTagInput('');
      return toast.error('Tag already added');
    }

    // Sécurité supplémentaire (même si l'input est désactivé)
    if (isMaxReached) return toast.error(`Max ${MAX_TAGS} tags allowed`);

    setTags([...tags, val]);
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-700">Your Interests</h2>
      <p className="text-gray-500 text-sm">Type a tag and press Space or Enter (ex: vegan, geek, gym...)</p>

      {/* Le conteneur change de style si désactivé */}
      <div
        className={`
          border p-3 rounded-lg flex flex-wrap gap-2 items-center min-h-[50px] transition-all
          ${
            isMaxReached
              ? 'bg-gray-50 border-gray-200'
              : 'bg-white border-gray-300 focus-within:ring-2 focus-within:ring-primary1'
          }
        `}
      >
        {tags.map((tag, idx) => (
          <Badge key={idx} onRemove={() => removeTag(tag)}>
            #{tag}
          </Badge>
        ))}

        <input
          type="text"
          value={tagInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isMaxReached} // <-- C'est ici que la magie opère
          className={`
            flex-grow outline-none bg-transparent min-w-[80px] py-1 text-sm
            ${isMaxReached ? 'cursor-not-allowed placeholder-red-400' : 'placeholder-gray-400'}
          `}
          placeholder={
            isMaxReached ? `Limit reached (${MAX_TAGS}/${MAX_TAGS})` : tags.length === 0 ? 'Add a tag...' : ''
          }
        />
      </div>

      {/* Petit compteur discret pour info */}
      <div className={`text-right text-xs ${isMaxReached ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        {tags.length}/{MAX_TAGS} tags
      </div>
    </div>
  );
};

export default InterestsStep;
