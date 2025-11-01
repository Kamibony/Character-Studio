
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { UserCharacter } from '../types';
import { api } from '../services/api';
import Loader from '../components/Loader';
import CharacterCard from '../components/CharacterCard';

const CharacterSelectionPage: React.FC = () => {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const fetchedCharacters = await api.getCharacterLibrary();
        setCharacters(fetchedCharacters);
      } catch (err) {
        setError('Failed to load your character library. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  if (loading) {
    return <Loader text="Loading Your Library..." />;
  }

  if (error) {
    return <div className="text-center text-red-400">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Character Library</h1>
        <Link
          to="/upload"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform transform hover:scale-105"
        >
          <PlusCircle size={20} />
          Create New
        </Link>
      </div>
      {characters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-surface rounded-lg border-2 border-dashed border-gray-600">
          <h2 className="text-2xl font-semibold mb-2">Your library is empty.</h2>
          <p className="text-text-secondary mb-6">
            Create your first character to start generating images.
          </p>
          <Link
            to="/upload"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105"
          >
            <PlusCircle size={20} />
            Create Your First Character
          </Link>
        </div>
      )}
    </div>
  );
};

export default CharacterSelectionPage;
