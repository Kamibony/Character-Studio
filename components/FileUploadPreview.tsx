
import React from 'react';
import { X } from 'lucide-react';

interface FileUploadPreviewProps {
  file: File;
  onRemove: (fileName: string) => void;
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ file, onRemove }) => {
  const previewUrl = URL.createObjectURL(file);

  return (
    <div className="relative group">
      <img src={previewUrl} alt={file.name} className="w-full h-32 object-cover rounded-md" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
        <button
          onClick={() => onRemove(file.name)}
          className="absolute top-1 right-1 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default FileUploadPreview;
