import React, { useState, useEffect } from 'react';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import PlayerBar from './components/Layout/PlayerBar';
import MainView from './components/Layout/MainView';
import { PlayerProvider } from './context/PlayerContext';
import UploadModal from './components/UploadModal';
import Login from './components/Login';
import { supabase } from './supabaseClient';

import CreateVaultModal from './components/CreateVaultModal';

const App = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateVaultModalOpen, setIsCreateVaultModalOpen] = useState(false);
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
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-emerald-500">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <PlayerProvider>
      <div className="flex h-screen bg-[#121212] text-white overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-500">
        <LeftSidebar
          onUpload={() => setIsUploadModalOpen(true)}
          onCreateVault={() => setIsCreateVaultModalOpen(true)}
        />
        <MainView onUpload={() => setIsUploadModalOpen(true)} />
        <RightSidebar />
        <PlayerBar />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
        <CreateVaultModal
          isOpen={isCreateVaultModalOpen}
          onClose={() => setIsCreateVaultModalOpen(false)}
        />
      </div>
    </PlayerProvider>
  );
};

export default App;
