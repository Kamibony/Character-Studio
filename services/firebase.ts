import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyARuwcn4hMmt7MD5tTTp_r2HVqSu8Zno20",
  authDomain: "character-studio-comics.firebaseapp.com",
  projectId: "character-studio-comics",
  storageBucket: "character-studio-comics.appspot.com",
  messagingSenderId: "673014807195",
  appId: "1:673014807195:web:979046c375fe0b7e26e43e",
  measurementId: "G-4BT7DFW596"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let firebaseError: Error | null = null;
export const projectId = firebaseConfig.projectId;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  // FIX: Explicitly set the functions region to match the backend deployment.
  functions = getFunctions(app, 'us-central1');
  googleProvider = new GoogleAuthProvider();
} catch (e: any) {
  firebaseError = e;
  // Make the error message more specific if it's the known API key issue.
  if (e.message?.includes('api-key-not-valid')) {
      firebaseError = new Error("The provided Firebase API Key is not valid. Please check the configuration in `services/firebase.ts` and ensure it is correct.");
  }
  console.error("Firebase initialization failed:", firebaseError);
}


export { auth, firestore, storage, functions, googleProvider, firebaseError };