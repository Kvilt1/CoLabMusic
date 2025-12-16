import React, { useMemo, useState } from 'react';
import { Music, Play, Shuffle, Search, X, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Hero = () => {
    const { currentView, currentGroup, songs, playSong, toggleShuffle, isShuffled, setListSearchQuery, listSearchQuery, switchView } = usePlayer();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const isVaultView = currentView !== 'all';
    const vaultName = currentGroup?.name || 'Vault';

    const heroStyle = useMemo(() => {
        if (currentView === 'all') {
            return { background: 'linear-gradient(to bottom, #202020, #121212)' };
        }
        return { background: `linear-gradient(to bottom, ${currentGroup?.bg_hex}40, #121212)` };
    }, [currentView, currentGroup]);

    const handlePlayVault = () => {
        if (songs.length > 0) {
            if (isShuffled) {
                const randomIndex = Math.floor(Math.random() * songs.length);
                playSong(songs[randomIndex]);
            } else {
                playSong(songs[0]);
            }
        }
    };

    return (
        <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-80 -z-10 transition-colors duration-700" style={heroStyle}></div>

            <div className="pt-24 px-8 pb-8">
                <div className="flex items-end gap-6 mb-8 transition-all duration-300">
                    {isVaultView && (
                        <div className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 duration-500">
                            {currentGroup?.cover_url ? (
                                <img src={currentGroup.cover_url} alt={vaultName} className="w-56 h-56 rounded-md shadow-lg object-cover" />
                            ) : (
                                <div className={`w-56 h-56 bg-gradient-to-br ${currentGroup?.color || 'from-gray-700 to-gray-900'} flex items-center justify-center rounded-md shadow-lg`}>
                                    <Music className="w-24 h-24 text-white/40 drop-shadow-md" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                            {currentView === 'all' ? 'Public Stream' : 'Private Vault'}
                        </span>
                        <h1 className="text-7xl font-black mt-2 mb-4 tracking-tighter text-white drop-shadow-lg">
                            {currentView === 'all' ? 'Home Stream' : vaultName}
                        </h1>
                        <p className="text-gray-300 font-medium text-sm flex items-center gap-2">
                            {currentView === 'all'
                                ? "Combined tracks from all your active vaults."
                                : `${songs.length} songs • Created by You`
                            }
                        </p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-8 mb-8">
                    {!isSearchOpen ? (
                        <>
                            <button
                                onClick={handlePlayVault}
                                className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:scale-105 hover:bg-emerald-400 transition shadow-xl text-black translate-y-0 active:translate-y-1"
                            >
                                <Play className="w-7 h-7 fill-current ml-1" />
                            </button>
                            <button
                                onClick={toggleShuffle}
                                className={`transition ${isShuffled ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Shuffle className="w-8 h-8" />
                            </button>
                            {isVaultView && currentGroup?.id && (
                                <button
                                    onClick={() => switchView('vault-settings', { vaultId: currentGroup.id })}
                                    className="text-gray-400 hover:text-white transition hover:rotate-90 duration-300"
                                    title="Vault Settings"
                                >
                                    <Settings className="w-8 h-8" />
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <div className="relative group">
                                <button 
                                    onClick={() => setIsSearchOpen(true)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                                >
                                    <span className="text-xs uppercase font-bold group-hover:text-white transition">Search in list</span>
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-end gap-3 animate-fade-in">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={listSearchQuery}
                                    onChange={(e) => setListSearchQuery(e.target.value)}
                                    placeholder="Filter current view..."
                                    autoFocus
                                    className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-md py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:bg-[#333] focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                                />
                                {listSearchQuery && (
                                    <button
                                        onClick={() => setListSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setListSearchQuery('');
                                }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                                title="Close search"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Hero;
