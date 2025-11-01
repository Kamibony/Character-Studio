
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { UserCharacter } from '../types';
import { Clock, CheckCircle, AlertTriangle, Loader as LoaderIcon } from 'lucide-react';

const statusInfo = {
  pending: {
    icon: <Clock className="h-16 w-16 text-yellow-400" />,
    title: "Training Queued",
    message: "Your character training job has been successfully submitted. It will begin processing shortly.",
    progress: 10,
  },
  training: {
    icon: <LoaderIcon className="h-16 w-16 text-blue-400 animate-spin" />,
    title: "Training in Progress...",
    message: "The AI is learning your character's features. This can take 15-30 minutes. You can safely close this page and come back later.",
    progress: 50,
  },
  ready: {
    icon: <CheckCircle className="h-16 w-16 text-green-400" />,
    title: "Training Complete!",
    message: "Your character is ready! Redirecting you to the studio...",
    progress: 100,
  },
  error: {
    icon: <AlertTriangle className="h-16 w-16 text-red-400" />,
    title: "Training Failed",
    message: "Something went wrong during the training process. Please try creating the character again.",
    progress: 100,
  }
};


const TrainingProgressPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      navigate('/');
      return;
    }

    const docRef = doc(firestore, 'user_characters', characterId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as UserCharacter;
        setCharacter(data);
        setError(null);

        if (data.status === 'ready') {
          setTimeout(() => navigate(`/character/${characterId}`), 2000);
        }
      } else {
        setError("Could not find the specified training job. It may have been deleted.");
      }
    }, (err) => {
      console.error("Firestore snapshot error:", err);
      setError("Failed to connect to the training status service.");
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, navigate]);

  const currentStatus = character?.status || 'pending';
  const { icon, title, message, progress } = statusInfo[currentStatus];

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-2xl w-full text-center p-8 bg-surface rounded-2xl shadow-lg border border-gray-700 animate-fade-in">
        {error ? (
          <>
            <AlertTriangle className="mx-auto h-16 w-16 text-red-400" />
            <h1 className="text-3xl font-bold mt-6">An Error Occurred</h1>
            <p className="text-text-secondary mt-2">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6">{icon}</div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-text-secondary mt-2 mb-8">{message}</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingProgressPage;
