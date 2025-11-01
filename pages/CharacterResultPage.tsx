import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { api } from '../services/api';
import { UserCharacter } from '../types';
import Loader from '../components/Loader';
// FIX: Imported Loader as LoaderIcon from lucide-react to fix 'Cannot find name 'LoaderIcon'' errors.
import { ArrowLeft, Wand2, Loader as LoaderIcon } from 'lucide-react';

const CharacterResultPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      setError("No character ID provided.");
      setIsLoading(false);
      return;
    }
    const docRef = doc(firestore, 'user_characters', characterId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCharacter({ id: docSnap.id, ...docSnap.data() } as UserCharacter);
      } else {
        setError("Character not found.");
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load character data.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [characterId]);
  
  const handleGenerate = async () => {
    if (!prompt || !characterId) return;
    setIsGenerating(true);
    try {
      const result = await api.generateCharacterVisualization({ characterId, prompt });
      setGeneratedImages(prev => [`data:image/png;base64,${result.base64Image}`, ...prev]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <Loader text="Loading Character Studio..." />;
  if (error) return <div className="text-center text-red-400">{error}</div>;
  if (!character) return <div className="text-center">Character data could not be loaded.</div>;

  return (
    <div className="animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowLeft size={16} /> Back to Library
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Character Info Panel */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-lg border border-gray-700 self-start">
          <img src={character.imagePreviewUrl || `https://picsum.photos/seed/${character.id}/500`} alt={character.characterName} className="w-full h-64 object-cover rounded-md mb-4" />
          <h1 className="text-3xl font-bold">{character.characterName}</h1>
          <p className="text-text-secondary mt-2">{character.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {character.keywords.map(kw => (
              <span key={kw} className="bg-primary/20 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{kw}</span>
            ))}
          </div>
        </div>

        {/* Generation Panel */}
        <div className="lg:col-span-2">
          <div className="bg-surface p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Generate Image</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g., ${character.characterName} sitting on a throne, epic lighting`}
              className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary h-28 resize-none"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <LoaderIcon className="animate-spin h-5 w-5" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} /> Generate
                </>
              )}
            </button>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Gallery</h3>
            {generatedImages.length === 0 && !isGenerating ? (
               <div className="text-center py-10 px-6 bg-surface rounded-lg border-2 border-dashed border-gray-600">
                <p className="text-text-secondary">Your generated images will appear here.</p>
               </div>
            ): (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isGenerating && <div className="aspect-square bg-surface rounded-lg flex items-center justify-center border border-gray-700 animate-pulse"><LoaderIcon className="h-8 w-8 text-gray-500 animate-spin" /></div>}
                {generatedImages.map((imgSrc, index) => (
                  <img key={index} src={imgSrc} alt={`Generated image ${index + 1}`} className="w-full h-auto object-cover rounded-lg shadow-lg" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterResultPage;
