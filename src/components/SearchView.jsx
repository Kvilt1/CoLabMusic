import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Music, Clock, Play, BarChart2 } from 'lucide-react';
import { useVaults, useAudioContext } from '../context';
import clsx from 'clsx';
import { getVaultGradient } from '../utils/vaultColors';

const SearchView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const { vaults, allSongs } = useVaults();
    const { playSong, currentSong, isPlaying, togglePlay } = useAudioContext();

    // Auto-focus search input when component mounts
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Search from local state (already loaded songs the user has access to)
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }

        const query = searchQuery.toLowerCase().trim();

        // Search all songs the user has access to (already loaded in context)
        return allSongs.filter(song =>
            song.title?.toLowerCase().includes(query) ||
            song.artist?.toLowerCase().includes(query)
        );
    }, [searchQuery, allSongs]);

    const clearSearch = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    const handleSongClick = (song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            playSong(song, searchResults);
        }
    };

    return (
        <div className="flex flex-col h-full bg-dark-900">
            {/* Search Input Area */}
            <div className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-xl px-8 py-6 border-b border-white/5">
                <div className="relative max-w-2xl mx-auto">
                    <Search className={clsx("absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors", searchQuery ? "text-orange-500" : "text-gray-500")} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What do you want to listen to?"
                        className="w-full bg-dark-800 text-white placeholder-gray-500 rounded-full py-4 pl-14 pr-12 text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:bg-dark-700 transition-all shadow-inner border border-white/5"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-8 pb-40 pt-6 custom-scrollbar">
                {!searchQuery ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 animate-fade-in">
                        <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/5">
                            <Search className="w-10 h-10 opacity-40 text-gray-500" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3 text-white">Search CoLab</h2>
                        <p className="text-base text-gray-500 max-w-md text-center">Find your favorite tracks by title or artist across all your vaults.</p>
                    </div>
                ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 animate-fade-in">
                        <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <Music className="w-10 h-10 opacity-40 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-white">No results found for "{searchQuery}"</h2>
                        <p className="text-sm text-gray-500">Please make sure your words are spelled correctly, or use less or different keywords.</p>
                    </div>
                ) : (
                    <div className="animate-fade-in max-w-5xl mx-auto">
                        <h2 className="text-xs font-bold mb-4 text-gray-500 uppercase tracking-wider px-4">
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </h2>

                        {/* Results Table Header */}
                        <div className="grid grid-cols-[40px_4fr_2fr_40px] gap-4 text-gray-500 text-xs border-b border-white/5 pb-3 mb-2 px-4 uppercase font-bold tracking-wider">
                            <div className="text-center">#</div>
                            <div>Title</div>
                            <div>Vault</div>
                            <div className="text-right"><Clock className="w-3.5 h-3.5 ml-auto" /></div>
                        </div>

                        {/* Results List */}
                        <div className="space-y-1">
                            {searchResults.map((song, index) => {
                                const group = vaults.find(g => g.id === song.vault_id);
                                const isCurrent = currentSong?.id === song.id;

                                // Format duration from seconds to M:SS
                                const formatDuration = (seconds) => {
                                    if (!seconds) return '0:00';
                                    const mins = Math.floor(seconds / 60);
                                    const secs = seconds % 60;
                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                };

                                return (
                                    <div
                                        key={song.id}
                                        onClick={() => handleSongClick(song)}
                                        className={clsx(
                                            "group grid grid-cols-[40px_4fr_2fr_40px] gap-4 px-4 py-3 rounded-xl transition items-center cursor-pointer border border-transparent",
                                            isCurrent
                                                ? "bg-white/5 border-orange-500/20 shadow-lg"
                                                : "hover:bg-white/5 hover:border-white/5"
                                        )}
                                    >
                                        {/* Play State / Index */}
                                        <div className="flex items-center justify-center relative w-5">
                                            {isCurrent && isPlaying ? (
                                                <BarChart2 className="w-4 h-4 text-orange-500 animate-pulse" />
                                            ) : (
                                                <>
                                                    <span className={clsx(
                                                        "font-mono text-gray-500 text-sm group-hover:hidden transition-colors",
                                                        isCurrent && "text-orange-500 font-bold"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                    <Play className={clsx("w-4 h-4 text-white hidden group-hover:block fill-current transition-all", isCurrent && !isPlaying && "!block text-orange-500")} />
                                                </>
                                            )}
                                        </div>

                                        {/* Song Info with Cover */}
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-12 h-12 bg-dark-800 flex-shrink-0 rounded-lg overflow-hidden relative shadow-md group-hover:shadow-orange-500/10 transition-shadow border border-white/5">
                                                {song.cover_url ? (
                                                    <img 
                                                        src={song.cover_url} 
                                                        className="w-full h-full object-cover" 
                                                        alt={song.title} 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Music className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                )}
                                                {/* Overlay for currently playing */}
                                                {isCurrent && (
                                                    <div className="absolute inset-0 bg-orange-500/10 ring-1 ring-inset ring-orange-500/50"></div>
                                                )}
                                            </div>

                                            <div className="flex flex-col overflow-hidden">
                                                <span className={clsx(
                                                    "font-bold truncate text-sm mb-0.5 transition-colors",
                                                    isCurrent ? "text-orange-500" : "text-white group-hover:text-white"
                                                )}>
                                                    {song.title}
                                                </span>
                                                <span className="text-xs text-gray-400 truncate group-hover:text-white transition">
                                                    {song.artist}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Vault Name */}
                                        <div className="text-sm text-gray-400">
                                            {group ? (
                                                <span className="truncate group-hover:text-white transition flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full inline-block bg-gradient-to-br ${getVaultGradient(group.id)}`}></span>
                                                    {group.name}
                                                </span>
                                            ) : (
                                                <span className="opacity-50 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-gray-700"></span>
                                                    Unknown Vault
                                                </span>
                                            )}
                                        </div>

                                        {/* Duration */}
                                        <div className="text-sm text-gray-500 font-mono text-right group-hover:text-white transition">
                                            {formatDuration(song.duration_seconds || song.duration)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchView;
