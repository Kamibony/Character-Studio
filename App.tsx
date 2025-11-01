
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import CharacterSelectionPage from './pages/CharacterSelectionPage';
import FileUploadPage from './pages/FileUploadPage';
import TrainingProgressPage from './pages/TrainingProgressPage';
import CharacterResultPage from './pages/CharacterResultPage';
import Header from './components/Header';
import Loader from './components/Loader';
import { firebaseError } from './services/firebase';
import { AlertTriangle } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader text="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </>
  );
};

const App: React.FC = () => {
  if (firebaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary p-4">
        <div className="text-center p-8 bg-surface rounded-2xl shadow-2xl max-w-2xl w-full border border-red-500">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-red-300">Application Initialization Failed</h1>
          <p className="text-lg text-text-secondary mb-6">
            There was an error connecting to the backend services. Please check your Firebase configuration.
          </p>
          <div className="bg-background/50 p-4 rounded-lg text-left">
            <p className="font-semibold text-text-primary mb-2">Error Details:</p>
            <p className="font-mono text-sm text-red-300 break-words">
              {firebaseError.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
};

const Router: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader text="Loading Character Studio..." />
            </div>
        );
    }
    
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<CharacterSelectionPage />} />
                    <Route path="/upload" element={<FileUploadPage />} />
                    <Route path="/training/:characterId" element={<TrainingProgressPage />} />
                    <Route path="/character/:characterId" element={<CharacterResultPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
