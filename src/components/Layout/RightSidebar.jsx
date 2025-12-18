import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Music2, X, ListMusic, Trash2 } from 'lucide-react';
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

    const currentIndex = currentSong ? queue.findIndex(s => s.id === currentSong.id) : -1;
    const nextInContext = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

    const sourceLabel = currentView === 'all' ? 'Home Stream' : (currentGroup?.name || 'Unknown Vault');

    return (
        <aside className="w-[350px] bg-dark-900 flex-shrink-0 flex flex-col overflow-hidden m-2 ml-0 rounded-2xl shadow-2xl border border-dark-700 z-30 relative animate-in slide-in-from-right-10 duration-300">
            <div className="p-5 flex items-center justify-between bg-dark-900/95 backdrop-blur-sm border-b border-white/5 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ListMusic className="w-5 h-5 text-orange-500" />
                    Queue
                </h2>
                <div className="flex items-center gap-3">
                    {userQueue.length > 0 && (
                        <button className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-white/5" title="Clear Queue">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={toggleQueue}
                        className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-8 pb-32">

                {/* Now Playing Section */}
                {currentSong && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Now playing</h3>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition group cursor-pointer shadow-lg">
                            <div className="w-12 h-12 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-inner">
                                {(currentSong.cover_url || currentSong.cover) ? (
                                    <img src={currentSong.cover_url || currentSong.cover} alt="Art" className="w-full h-full object-cover" />
                                ) : (
                                    <Music2 className="text-gray-600 w-6 h-6" />
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#ff5500]"></div>
                                    </div>
                                )}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <div className="text-sm font-bold text-orange-500 truncate">{currentSong.title}</div>
                                <div className="text-xs text-gray-400 truncate">{currentSong.artist}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Queue (Next in Queue) */}
                {userQueue.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Next in queue</h3>
                        </div>
                        <div className="space-y-1">
                            {userQueue.map((song, i) => (
                                <div
                                    key={`uq-${song.id}-${i}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group cursor-pointer border border-transparent hover:border-white/5"
                                    onClick={() => playSong(song)}
                                >
                                    <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                        {(song.cover_url || song.cover) ? (
                                            <img src={song.cover_url || song.cover} alt="Art" className="w-full h-full object-cover" />
                                        ) : (
                                            <Music2 className="text-gray-600 w-4 h-4" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center backdrop-blur-[1px]">
                                            <Play className="w-4 h-4 text-white fill-current" />
                                        </div>
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="text-sm font-medium text-white truncate group-hover:text-orange-400 transition">{song.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono">
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
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Next from: <span className="text-gray-300">{sourceLabel}</span></h3>
                        <div className="space-y-1">
                            {nextInContext.map((song, i) => (
                                <div
                                    key={`cq-${song.id}-${i}`}
                                    onClick={() => playSong(song)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group cursor-pointer border border-transparent hover:border-white/5 opacity-70 hover:opacity-100"
                                >
                                    <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                        {(song.cover_url || song.cover) ? (
                                            <img src={song.cover_url || song.cover} alt="Art" className="w-full h-full object-cover" />
                                        ) : (
                                            <Music2 className="text-gray-600 w-4 h-4" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center backdrop-blur-[1px]">
                                            <Play className="w-4 h-4 text-white fill-current" />
                                        </div>
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="text-sm font-medium text-gray-300 truncate group-hover:text-orange-400 transition">{song.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono">
                                        {song.duration}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {userQueue.length === 0 && nextInContext.length === 0 && (
                    <div className="text-center text-gray-600 py-10 text-sm italic">
                        End of queue
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;
