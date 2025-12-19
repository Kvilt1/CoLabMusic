import React, { useState, useEffect } from 'react';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import PlayerBar from './components/Layout/PlayerBar';
import MainView from './components/Layout/MainView';
import { AppProvider, VaultProvider, AudioProvider, ToastProvider, useApp, useVaults } from './context';
import UploadModal from './components/UploadModal';
import Login from './components/Login';
import { supabase } from './supabaseClient';

import CreateVaultModal from './components/CreateVaultModal';
import JoinVaultModal from './components/JoinVaultModal';

// Service imports
import { ServiceProvider } from './services';
import { SupabaseAuthService } from './services/auth/SupabaseAuthService';
import { SupabaseVaultService } from './services/vault/SupabaseVaultService';
import { SupabaseVaultMemberService } from './services/vaultMember/SupabaseVaultMemberService';
import { SupabaseSongService } from './services/song/SupabaseSongService';
import { SupabaseStorageService } from './services/storage/SupabaseStorageService';
import { SupabaseRealtimeService } from './services/realtime/SupabaseRealtimeService';

// Create production service instances
const productionServices = {
  auth: new SupabaseAuthService(supabase),
  vault: new SupabaseVaultService(supabase),
  vaultMember: new SupabaseVaultMemberService(supabase),
  song: new SupabaseSongService(supabase),
  storage: new SupabaseStorageService(supabase),
  realtime: new SupabaseRealtimeService(supabase)
};

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
  const { switchView } = useApp();
  const { addSongToState } = useVaults();

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

// Main app wrapper with all providers
const AppWithProviders = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateVaultModalOpen, setIsCreateVaultModalOpen] = useState(false);
  const [isJoinVaultModalOpen, setIsJoinVaultModalOpen] = useState(false);

  return (
    <ServiceProvider services={productionServices}>
      <ToastProvider>
        <AppProvider>
          <AppRouter
            isUploadModalOpen={isUploadModalOpen}
            setIsUploadModalOpen={setIsUploadModalOpen}
            isCreateVaultModalOpen={isCreateVaultModalOpen}
            setIsCreateVaultModalOpen={setIsCreateVaultModalOpen}
            isJoinVaultModalOpen={isJoinVaultModalOpen}
            setIsJoinVaultModalOpen={setIsJoinVaultModalOpen}
          />
        </AppProvider>
      </ToastProvider>
    </ServiceProvider>
  );
};

// Router component that handles authentication
const AppRouter = ({
  isUploadModalOpen,
  setIsUploadModalOpen,
  isCreateVaultModalOpen,
  setIsCreateVaultModalOpen,
  isJoinVaultModalOpen,
  setIsJoinVaultModalOpen
}) => {
  const { currentUser, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-orange-500">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <VaultProvider currentUser={currentUser}>
      <AudioProvider>
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
      </AudioProvider>
    </VaultProvider>
  );
};

const App = () => {
  return <AppWithProviders />;
};

export default App;
