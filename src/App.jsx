import React, { useState, useEffect } from 'react';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import PlayerBar from './components/Layout/PlayerBar';
import MainView from './components/Layout/MainView';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import UploadModal from './components/UploadModal';
import Login from './components/Login';
import { supabase } from './supabaseClient';

import CreateVaultModal from './components/CreateVaultModal';
import JoinVaultModal from './components/JoinVaultModal';

const AppContent = ({ 
  onUpload, 
  onCreateVault, 
  onJoinVault,
  isUploadModalOpen, 
  setIsUploadModalOpen, 
  isCreateVaultModalOpen, 
  setIsCreateVaultModalOpen,
  isJoinVaultModalOpen,
  setIsJoinVaultModalOpen
}) => {
  const { switchView, addSongToState } = usePlayer();

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        switchView('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchView]);

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden font-sans">
      <LeftSidebar
        onUpload={onUpload}
        onCreateVault={onCreateVault}
        onJoinVault={onJoinVault}
      />
      
      {/* Main Content Area - flex-1 to take remaining width */}
      <div className="flex-1 flex overflow-hidden relative">
        <MainView onUpload={onUpload} />
        <RightSidebar />
        
        {/* Floating Player is absolute/fixed within the context or just overlays */}
        <PlayerBar />
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSongUploaded={addSongToState}
      />
      <CreateVaultModal
        isOpen={isCreateVaultModalOpen}
        onClose={() => setIsCreateVaultModalOpen(false)}
      />
      <JoinVaultModal
        isOpen={isJoinVaultModalOpen}
        onClose={() => setIsJoinVaultModalOpen(false)}
      />
    </div>
  );
};

const App = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateVaultModalOpen, setIsCreateVaultModalOpen] = useState(false);
  const [isJoinVaultModalOpen, setIsJoinVaultModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-orange-500">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <PlayerProvider>
      <AppContent 
        onUpload={() => setIsUploadModalOpen(true)}
        onCreateVault={() => setIsCreateVaultModalOpen(true)}
        onJoinVault={() => setIsJoinVaultModalOpen(true)}
        isUploadModalOpen={isUploadModalOpen}
        setIsUploadModalOpen={setIsUploadModalOpen}
        isCreateVaultModalOpen={isCreateVaultModalOpen}
        setIsCreateVaultModalOpen={setIsCreateVaultModalOpen}
        isJoinVaultModalOpen={isJoinVaultModalOpen}
        setIsJoinVaultModalOpen={setIsJoinVaultModalOpen}
      />
    </PlayerProvider>
  );
};

export default App;
