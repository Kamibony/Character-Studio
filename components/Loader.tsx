
import React from 'react';
import { Loader as LoaderIcon } from 'lucide-react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <LoaderIcon className="h-10 w-10 animate-spin text-primary" />
      <p className="text-lg text-text-secondary">{text}</p>
    </div>
  );
};

export default Loader;
