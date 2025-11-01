import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, projectId } from '../services/firebase';
import { Zap, AlertTriangle, ExternalLink, RotateCw } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth!, googleProvider!);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError({
            title: 'Configuration Required: Domain Not Authorized',
            message: `For security, your app's domain must be authorized before users can sign in. Please add the domain below to your Firebase project settings.`
        });
      } else {
        setError({
            title: 'Sign-In Failed',
            message: 'An unexpected error occurred during sign-in. Please try again.'
        });
      }
      console.error(err);
      setIsSigningIn(false);
    }
  };

  const handleRetrySignIn = () => {
    setError(null);
    handleGoogleSignIn();
  };
  
  const handleReload = () => {
    window.location.reload();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const isConfigError = error?.title.includes('Configuration Required');

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center p-8 bg-surface rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700">
        
        {isConfigError ? (
          <div className="animate-fade-in">
             <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-500/20 rounded-full">
                    <AlertTriangle className="h-12 w-12 text-yellow-400" />
                </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-yellow-300">{error.title}</h1>
            <p className="text-lg text-text-secondary mb-8">
                {error.message}
            </p>
             <div className="text-left text-sm text-gray-300 bg-background/50 p-4 rounded-lg border border-gray-600 space-y-4">
                <div>
                    <p className="font-bold text-gray-200 mb-2">1. Go to your Firebase Console:</p>
                    <a 
                        href={`https://console.firebase.google.com/project/${projectId}/authentication/settings`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Authentication Settings <ExternalLink size={16} />
                    </a>
                </div>
                 <div>
                    <p className="font-bold text-gray-200 mb-2">2. Add this domain to the "Authorized domains" list:</p>
                    <div className="flex items-center gap-2">
                        <code className="bg-gray-800 border border-gray-600 px-2 py-2 rounded text-white font-mono flex-grow break-all">{window.location.hostname}</code>
                        <button
                            onClick={() => handleCopyToClipboard(window.location.hostname)}
                            className="bg-secondary hover:bg-secondary/80 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all flex-shrink-0"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
                 <div className="pt-3 border-t border-gray-600/50">
                    <p className="font-semibold text-gray-200 text-xs">After adding the domain, it may take a minute to apply. If it still fails, try reloading the page.</p>
                </div>
            </div>
            <div className="flex gap-4 mt-8">
                <button
                    onClick={handleReload}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCw size={16} /> Reload Page
                </button>
                <button
                    onClick={handleRetrySignIn}
                    disabled={isSigningIn}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                    {isSigningIn ? 'Retrying...' : "Retry Sign-In"}
                </button>
            </div>
          </div>
        ) : (
          <>
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
            {error && !isConfigError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-left">
                  <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                          <h3 className="font-bold text-red-300">{error.title}</h3>
                          <p className="text-red-400 text-sm mt-1">{error.message}</p>
                      </div>
                  </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;