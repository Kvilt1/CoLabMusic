import React, { useMemo, useState } from 'react';
import { Music, Play, Shuffle, Search, X, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Hero = () => {
    const { currentView, currentGroup, songs, playSong, toggleShuffle, isShuffled, setListSearchQuery, listSearchQuery, switchView } = usePlayer();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Safety check: if we are in a vault view but currentGroup isn't loaded yet, don't crash
    if (currentView !== 'all' && !currentGroup) {
        return null; // Or return a loading skeleton
    }

    const heroStyle = useMemo(() => {
        if (currentView === 'all') {
            return { background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)' };
        }
        // Use group color but fallback to orange if not set or invalid, mixed with dark
        return { background: `linear-gradient(to bottom, ${currentGroup?.bg_hex || '#1a1a1a'}40, #0a0a0a)` };
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
            <div className="absolute top-0 left-0 right-0 h-96 -z-10 transition-colors duration-700 opacity-60 pointer-events-none" style={heroStyle}></div>
            {/* Ambient Glow */}
            <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>

            <div className="pt-24 px-8 pb-8">
                <div className="flex items-end gap-8 mb-10 transition-all duration-300">
                    {currentView !== 'all' && (
                        <div className="shadow-[0_20px_60px_-15px_rgba(255,85,0,0.15)] transition-transform hover:scale-105 duration-500 group">
                            {currentGroup.cover_url ? (
                                <img src={currentGroup.cover_url} alt={currentGroup.name} className="w-60 h-60 rounded-2xl shadow-2xl object-cover" />
                            ) : (
                                <div className={`w-60 h-60 bg-gradient-to-br ${currentGroup.color || 'from-dark-800 to-dark-900'} flex items-center justify-center rounded-2xl shadow-2xl border border-white/5 group-hover:border-orange-500/30 transition-colors`}>
                                    <Music className="w-24 h-24 text-white/20 drop-shadow-md group-hover:text-orange-500/40 transition-colors" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block">
                            {currentView === 'all' ? 'Public Stream' : 'Private Vault'}
                        </span>
                        <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tighter text-white drop-shadow-xl leading-none">
                            {currentView === 'all' ? 'Home Stream' : currentGroup.name}
                        </h1>
                        <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                            {currentView === 'all'
                                ? "Combined tracks from all your active vaults."
                                : <span className="flex items-center gap-2"><span className="text-white font-bold">{songs.length}</span> songs • Created by You</span>
                            }
                        </p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-6 mb-8">
                    {!isSearchOpen ? (
                        <>
                            <button
                                onClick={handlePlayVault}
                                className="h-14 px-8 bg-white text-black rounded-full flex items-center justify-center gap-3 hover:scale-105 hover:bg-orange-500 hover:text-white transition shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,85,0,0.4)] active:scale-95 font-bold tracking-wide cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                PLAY
                            </button>
                            <button
                                onClick={toggleShuffle}
                                className={`w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${isShuffled ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:border-white'}`}
                            >
                                <Shuffle className="w-5 h-5" />
                            </button>
                            {currentView !== 'all' && (
                                <button
                                    onClick={() => switchView('vault-settings', { vaultId: currentGroup.id })}
                                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition hover:rotate-90 duration-300 cursor-pointer"
                                    title="Vault Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <div className="relative group">
                                <button 
                                    onClick={() => setIsSearchOpen(true)}
                                    className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-end gap-3 animate-fade-in">
                            <div className="relative w-full max-w-lg">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                                <input
                                    type="text"
                                    value={listSearchQuery}
                                    onChange={(e) => setListSearchQuery(e.target.value)}
                                    placeholder="Filter current view..."
                                    autoFocus
                                    className="w-full bg-dark-800 text-white placeholder-gray-500 rounded-full py-3 pl-11 pr-11 text-sm focus:outline-none focus:bg-dark-700 focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner border border-white/5"
                                />
                                {listSearchQuery && (
                                    <button
                                        onClick={() => setListSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition cursor-pointer"
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
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
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
