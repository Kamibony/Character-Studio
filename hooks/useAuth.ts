
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
// The lines below are disabled for preview mode
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- PREVIEW MODE: MOCK AUTHENTICATION ---
    // To allow testing without a real login, we are providing a mock user.
    // This bypasses the need for Firebase sign-in and domain authorization.
    // To re-enable real authentication, comment out this block and uncomment the "PRODUCTION" block below.

    console.warn("AUTHENTICATION BYPASSED: Running in preview mode with a mock user.");
    const mockUser = {
      uid: 'mock-user-for-preview',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=testUser`,
    } as unknown as User;
    
    // Simulate async user loading
    setTimeout(() => {
        setUser(mockUser);
        setLoading(false);
    }, 300);


    // --- PRODUCTION AUTHENTICATION (Currently Disabled) ---
    /*
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
    */
  }, []);

  // FIX: Replaced JSX with React.createElement to be valid in a .ts file. The original JSX syntax caused parsing errors because the file extension is .ts, not .tsx.
  return React.createElement(AuthContext.Provider, { value: { user, loading } }, children);
};

export const useAuth = () => useContext(AuthContext);