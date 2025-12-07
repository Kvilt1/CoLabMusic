import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Music2, X } from 'lucide-react';
import clsx from 'clsx';

const RightSidebar = () => {
    const {
        currentSong,
        queue,
        userQueue,
        isQueueOpen,
        toggleQueue,
        playSong,
        isPlaying,
        currentGroup,
        currentView
    } = usePlayer();

    if (!isQueueOpen) return null;

    // FIND next up context songs
    // We need to know where we are in the main queue strings
    // But queue is the full list.
    // In PlayerContext we track queueIndex. But we don't export it? 
    // We can infer it or export it. In "nextSong" we use activeIndex.
    // Let's just filter queue by index > currentSong index?
    // User might have duplicates, so ID matching is risky if duplicates allowed.
    // For now, assuming standard index finding for simplicity of display.

    const currentIndex = currentSong ? queue.findIndex(s => s.id === currentSong.id) : -1;
    const nextInContext = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

    const sourceLabel = currentView === 'all' ? 'Home Stream' : (currentGroup?.name || 'Unknown Vault');

    // Refactored to be a flex item (no fixed positioning)
    // Matches main view styling: rounded, margins
    return (
        <aside className="w-[400px] bg-[#121212] flex-shrink-0 flex flex-col overflow-hidden m-2 ml-0 rounded-lg shadow-xl border-l border-[#282828] z-30 relative">
            <div className="p-4 flex items-center justify-between bg-[#121212] z-10">
                <h2 className="text-lg font-bold text-white">Queue</h2>
                <div className="flex items-center gap-4">
                    {userQueue.length > 0 && (
                        <button className="text-xs font-bold text-gray-400 hover:text-white transition uppercase">Clear queue</button>
                    )}
                    <button
                        onClick={toggleQueue}
                        className="text-gray-400 hover:text-white transition p-2 hover:bg-[#282828] rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar space-y-8">

                {/* Now Playing Section */}
                {currentSong && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3">Now playing</h3>
                        <div className="flex items-center gap-3 p-2 rounded-md bg-[#282828]/50 hover:bg-[#282828] transition group cursor-pointer border-l-4 border-emerald-500">
                            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                {currentSong.cover ? (
                                    <img src={currentSong.cover} alt="Art" className="w-full h-full object-cover rounded" />
                                ) : (
                                    <Music2 className="text-gray-500 w-5 h-5" />
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <div className="text-sm font-semibold text-emerald-500 truncate">{currentSong.title}</div>
                                <div className="text-xs text-gray-400 truncate">{currentSong.artist}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Queue (Next in Queue) */}
                {userQueue.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-400">Next in queue</h3>
                        </div>
                        <div className="space-y-1">
                            {userQueue.map((song, i) => (
                                <div
                                    key={`uq-${song.id}-${i}`}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] transition group cursor-pointer"
                                    onClick={() => playSong(song)} // Should this play from here? Ideally specific function. For now plays song.
                                >
                                    <div className="w-10 h-10 bg-[#282828] rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                        {song.cover ? (
                                            <img src={song.cover} alt="Art" className="w-full h-full object-cover" />
                                        ) : (
                                            <Music2 className="text-gray-600 w-5 h-5" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="text-sm font-medium text-emerald-400 truncate">{song.title}</div>
                                        <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {song.duration}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Context Queue (Next from Vault) */}
                {nextInContext.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3">Next from: <span className="text-white">{sourceLabel}</span></h3>
                        <div className="space-y-1">
                            {nextInContext.map((song, i) => (
                                <div
                                    key={`cq-${song.id}-${i}`}
                                    onClick={() => playSong(song)}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] transition group cursor-pointer opacity-80 hover:opacity-100"
                                >
                                    <div className="w-10 h-10 bg-[#282828] rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                        {song.cover ? (
                                            <img src={song.cover} alt="Art" className="w-full h-full object-cover" />
                                        ) : (
                                            <Music2 className="text-gray-600 w-5 h-5" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5"></div>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition">{song.title}</div>
                                        <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {song.duration}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {userQueue.length === 0 && nextInContext.length === 0 && (
                    <div className="text-center text-gray-500 py-10 text-sm">
                        End of queue
                    </div>
                )}

                <div className="h-24"></div> {/* Spacer for fixed PlayerBar */}
            </div>
        </aside>
    );
};

export default RightSidebar;
