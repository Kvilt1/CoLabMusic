import React, { useMemo } from 'react';
import { Music, Play, Shuffle, Search } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Hero = () => {
    const { currentView, currentGroup, songs, playSong, toggleShuffle, isShuffled } = usePlayer();

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
            <div className="absolute top-0 left-0 right-0 h-60 md:h-80 -z-10 transition-colors duration-700" style={heroStyle}></div>

            <div className="pt-16 md:pt-24 px-4 md:px-8 pb-6 md:pb-8">
                {/* Desktop Layout */}
                <div className="hidden md:flex items-end gap-6 mb-8 transition-all duration-300">
                    {currentView !== 'all' && (
                        <div className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 duration-500">
                            {currentGroup.coverUrl ? (
                                <img src={currentGroup.coverUrl} alt={currentGroup.name} className="w-56 h-56 rounded-md shadow-lg object-cover" />
                            ) : (
                                <div className={`w-56 h-56 bg-gradient-to-br ${currentGroup.color} flex items-center justify-center rounded-md shadow-lg`}>
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
                            {currentView === 'all' ? 'Home Stream' : currentGroup.name}
                        </h1>
                        <p className="text-gray-300 font-medium text-sm flex items-center gap-2">
                            {currentView === 'all'
                                ? "Combined tracks from all your active vaults."
                                : `${songs.length} songs • Created by You`
                            }
                        </p>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="flex md:hidden flex-col gap-4 mb-6 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        {currentView !== 'all' && (
                            <div className="shadow-[0_15px_30px_-12px_rgba(0,0,0,0.5)] flex-shrink-0">
                                {currentGroup.coverUrl ? (
                                    <img src={currentGroup.coverUrl} alt={currentGroup.name} className="w-32 h-32 rounded-lg shadow-lg object-cover" />
                                ) : (
                                    <div className={`w-32 h-32 bg-gradient-to-br ${currentGroup.color} flex items-center justify-center rounded-lg shadow-lg`}>
                                        <Music className="w-16 h-16 text-white/40 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 block mb-1">
                                {currentView === 'all' ? 'Public Stream' : 'Private Vault'}
                            </span>
                            <h1 className="text-3xl md:text-7xl font-black tracking-tight text-white drop-shadow-lg truncate">
                                {currentView === 'all' ? 'Home Stream' : currentGroup?.name}
                            </h1>
                            <p className="text-gray-300 font-medium text-xs mt-1">
                                {currentView === 'all'
                                    ? "All your tracks"
                                    : `${songs.length} songs`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-4 md:gap-8 mb-4 md:mb-8">
                    <button
                        onClick={handlePlayVault}
                        className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:scale-105 hover:bg-emerald-400 transition shadow-xl text-black translate-y-0 active:translate-y-1 active:scale-95"
                    >
                        <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-0.5 md:ml-1" />
                    </button>
                    <button
                        onClick={toggleShuffle}
                        className={`transition ${isShuffled ? 'text-emerald-500' : 'text-gray-400 hover:text-white active:scale-95'}`}
                    >
                        <Shuffle className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    <div className="flex-1"></div>
                    <div className="relative group hidden md:block">
                        <span className="text-xs text-gray-400 mr-2 uppercase font-bold group-hover:text-white transition">Search in list</span>
                        <button className="text-gray-400 hover:text-white transition"><Search className="w-5 h-5" /></button>
                    </div>
                    <button className="md:hidden text-gray-400 active:text-white transition p-2">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Hero;
