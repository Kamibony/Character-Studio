
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCharacter } from '../types';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface CharacterCardProps {
  character: UserCharacter;
}

const statusIndicator = {
  pending: { icon: <Clock size={16} className="text-yellow-400" />, text: 'Pending', color: 'text-yellow-400' },
  training: { icon: <Clock size={16} className="text-blue-400 animate-spin" />, text: 'Training', color: 'text-blue-400' },
  ready: { icon: <CheckCircle size={16} className="text-green-400" />, text: 'Ready', color: 'text-green-400' },
  error: { icon: <AlertTriangle size={16} className="text-red-400" />, text: 'Error', color: 'text-red-400' },
};

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const navigate = useNavigate();
  const indicator = statusIndicator[character.status];

  const handleClick = () => {
    if (character.status === 'ready') {
      navigate(`/character/${character.id}`);
    } else if (character.status === 'pending' || character.status === 'training') {
        navigate(`/training/${character.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-surface rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-primary transition-all transform hover:-translate-y-1 cursor-pointer"
    >
      <img
        className="w-full h-48 object-cover"
        src={character.imagePreviewUrl || `https://picsum.photos/seed/${character.id}/400`}
        alt={character.characterName || 'Character Preview'}
      />
      <div className="p-4">
        <h3 className="font-bold text-lg truncate">{character.characterName || 'Processing...'}</h3>
        <div className={`flex items-center gap-2 mt-2 text-sm ${indicator.color}`}>
          {indicator.icon}
          <span>{indicator.text}</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
