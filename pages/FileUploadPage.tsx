
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../services/firebase';
import { api } from '../services/api';
import FileUploadPreview from '../components/FileUploadPreview';
import { UploadCloud, Zap } from 'lucide-react';
import Loader from '../components/Loader';

const FileUploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.001);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles].slice(0, 10)); // Limit to 10 files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleTrain = async () => {
    if (!user || files.length < 5) {
      setError('Please select at least 5 images to start training.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    const characterId = uuidv4();

    try {
      const uploadPromises = files.map(file => {
        const fileRef = ref(storage, `training-images/${user.uid}/${characterId}/${file.name}`);
        return uploadBytes(fileRef, file).then(snapshot => snapshot.ref.fullPath);
      });

      const filePaths = await Promise.all(uploadPromises);

      const result = await api.startCharacterTuning({
        files: filePaths,
        settings: { epochs, learningRate }
      });

      navigate(`/training/${result.characterId}`);

    } catch (err) {
      console.error("Training initiation failed:", err);
      setError("Failed to start the training process. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader text="Uploading images and starting training job..." />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Create New Character</h1>
      <p className="text-text-secondary mb-8">Upload 5-10 high-quality photos of a character for the best results.</p>
      
      <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="font-semibold text-lg">Drop your photos here, or click to select</p>
        <p className="text-sm text-text-secondary">PNG, JPG, WEBP accepted (Max 10 images)</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Selected Files ({files.length}/10)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {files.map(file => (
              <FileUploadPreview key={file.name} file={file} onRemove={removeFile} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-surface rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Training Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="epochs" className="block text-sm font-medium text-text-secondary mb-2">Epochs</label>
            <input type="number" id="epochs" value={epochs} onChange={e => setEpochs(Number(e.target.value))} className="w-full bg-gray-800 border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary" />
            <p className="text-xs text-gray-400 mt-1">Number of training cycles. More can improve detail but takes longer.</p>
          </div>
          <div>
            <label htmlFor="learningRate" className="block text-sm font-medium text-text-secondary mb-2">Learning Rate</label>
            <input type="number" step="0.0001" id="learningRate" value={learningRate} onChange={e => setLearningRate(Number(e.target.value))} className="w-full bg-gray-800 border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary" />
            <p className="text-xs text-gray-400 mt-1">Controls how much the model changes in response to error.</p>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

      <div className="mt-8 text-center">
        <button 
          onClick={handleTrain} 
          disabled={files.length < 5 || isLoading}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg text-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transition-transform transform hover:scale-105"
        >
          <Zap size={20} />
          Start Training
        </button>
      </div>
    </div>
  );
};

export default FileUploadPage;
