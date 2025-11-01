
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Zap } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth!, googleProvider!);
      // The auth state listener in useAuth will handle the redirect.
    } catch (err: any) {
      if (err.code === 'auth/api-key-not-valid') {
        setError('Firebase configuration error. Please check your API key.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      console.error(err);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 bg-surface rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/20 rounded-full">
            <Zap className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-text-primary">Welcome to Character Studio</h1>
        <p className="text-lg text-text-secondary mb-8">
          Train AI models of your characters and bring them to life.
        </p>
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691c2.242-4.302 6.57-7.221 11.455-8.242l-5.657 5.657z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A7.94 7.94 0 0 1 24 36c-4.418 0-8-3.582-8-8h-8c0 6.627 5.373 12 12 12z"/><path fill="#1976D2" d="M43.611 20.083L42 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.012 35.244 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          )}
          {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
