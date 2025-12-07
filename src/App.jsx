import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Hero from './components/Hero';
import SongList from './components/SongList';
import PlayerBar from './components/Layout/PlayerBar';
import UploadModal from './components/UploadModal';
import RightSidebar from './components/Layout/RightSidebar';
import CreateVaultModal from './components/CreateVaultModal';
import { PlayerProvider } from './context/PlayerContext';
import clsx from 'clsx';
import './index.css';

const AppContent = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateVaultModalOpen, setIsCreateVaultModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = document.getElementById('main-scroll')?.scrollTop;
      setScrolled(offset > 50);
    };

    const main = document.getElementById('main-scroll');
    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="flex bg-black h-screen overflow-hidden text-white font-sans relative">
      <Sidebar onCreateVault={() => setIsCreateVaultModalOpen(true)} />

      {/* Main Content */}
      <main id="main-scroll" className="flex-1 overflow-y-auto relative bg-[#121212] m-2 rounded-lg ml-0 overflow-hidden custom-scrollbar">
        {/* Header Gradient / Glass */}
        <div className={clsx("sticky top-0 z-30 px-8 py-4 flex items-center justify-between transition-all duration-300", scrolled ? "bg-[#121212]/90 backdrop-blur-md shadow-lg" : "bg-transparent")}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-1.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition">
              Upload Music
            </button>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-black">R</div>
          </div>
        </div>

        <Hero />
        <SongList />

        <div className="h-20"></div> {/* Spacer for player */}
      </main>

      <RightSidebar />
      <PlayerBar />
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <CreateVaultModal isOpen={isCreateVaultModalOpen} onClose={() => setIsCreateVaultModalOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;
