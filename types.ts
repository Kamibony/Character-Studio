
import { Timestamp } from 'firebase/firestore';

export type CharacterStatus = 'pending' | 'training' | 'ready' | 'error';

export interface UserCharacter {
  id: string; // Document ID from Firestore
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string;
  adapterId: string | null;
}
