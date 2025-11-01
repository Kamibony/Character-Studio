
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // FIX: Replaced JSX with React.createElement to be valid in a .ts file. The original JSX syntax caused parsing errors because the file extension is .ts, not .tsx.
  return React.createElement(AuthContext.Provider, { value: { user, loading } }, children);
};

export const useAuth = () => useContext(AuthContext);
