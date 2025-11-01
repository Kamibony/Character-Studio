
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { UserCharacter } from '../types';

// Type definitions for function arguments and return values
interface StartTuningArgs {
  files: string[];
  settings: {
    learningRate: number;
    epochs: number;
  };
}

interface StartTuningResult {
  characterId: string;
}

interface GenerateVisArgs {
  characterId: string;
  prompt: string;
}

interface GenerateVisResult {
  base64Image: string;
}

// Callable function references
const startCharacterTuningFn = httpsCallable<StartTuningArgs, StartTuningResult>(functions, 'startCharacterTuning');
const generateCharacterVisualizationFn = httpsCallable<GenerateVisArgs, GenerateVisResult>(functions, 'generateCharacterVisualization');
const getCharacterLibraryFn = httpsCallable<void, UserCharacter[]>(functions, 'getCharacterLibrary');

// API service object
export const api = {
  startCharacterTuning: async (args: StartTuningArgs): Promise<StartTuningResult> => {
    const result = await startCharacterTuningFn(args);
    return result.data;
  },
  generateCharacterVisualization: async (args: GenerateVisArgs): Promise<GenerateVisResult> => {
    const result = await generateCharacterVisualizationFn(args);
    return result.data;
  },
  getCharacterLibrary: async (): Promise<UserCharacter[]> => {
    const result = await getCharacterLibraryFn();
    return result.data;
  },
};
