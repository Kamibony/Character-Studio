import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

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
  if (firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("AIzaSyARuwcn4hMmt7MD5tTTp_r2HVqSu8Zno20".substring(0,10))) {
    // Check for both the original placeholder and the new one to be safe
    if(firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
       throw new Error("Firebase configuration is missing or invalid. Please update `services/firebase.ts` with your project's configuration from the Firebase console.");
    }
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
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