
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';
import { LogOut, Zap } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth!);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  return (
    <header className="bg-surface/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Character Studio</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
              alt={user.displayName || 'User'}
              className="h-9 w-9 rounded-full"
            />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
