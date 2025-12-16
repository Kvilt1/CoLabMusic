import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music, Clock, Play, Pause, BarChart2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import clsx from 'clsx';

const SearchView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);
    const { playSong, currentSong, isPlaying, groups, togglePlay } = usePlayer();

    // Auto-focus search input when component mounts
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Search function - searches across title, artist, and album
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);

            // Import supabase to search the database
            const { supabase } = await import('../supabaseClient');
            
            const query = searchQuery.toLowerCase().trim();
            
            // Search in the database
            const { data: songs, error } = await supabase
                .from('songs')
                .select('*')
                .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (!error && songs) {
                setSearchResults(songs);
            } else {
                setSearchResults([]);
            }

            setIsSearching(false);
        };

        // Debounce search
        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        searchInputRef.current?.focus();
    };

    const handleSongClick = (song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            playSong(song);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#121212]">
            {/* Search Input Area */}
            <div className="sticky top-0 z-20 bg-[#121212] px-8 py-6">
                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What do you want to listen to?"
                        className="w-full bg-[#242424] text-white placeholder-gray-400 rounded-full py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-[#2a2a2a] transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-8 pb-32 custom-scrollbar">
                {!searchQuery ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-fade-in">
                        <div className="w-24 h-24 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Search CoLabMusic</h2>
                        <p className="text-sm text-gray-500">Find your favorite tracks by title, artist, or album</p>
                    </div>
                ) : isSearching ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                        <div className="w-20 h-20 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6">
                            <Music className="w-8 h-8 opacity-50" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-white">No results found for "{searchQuery}"</h2>
                        <p className="text-sm text-gray-500">Please make sure your words are spelled correctly, or use less or different keywords.</p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            Top Results
                        </h2>

                        {/* Results Table Header */}
                        <div className="grid grid-cols-[40px_4fr_2fr_2fr_40px] gap-4 text-gray-400 text-xs border-b border-[#282828] pb-2 mb-2 px-4 uppercase font-bold tracking-wider">
                            <div className="text-center">#</div>
                            <div>Title</div>
                            <div>Album</div>
                            <div>Vault</div>
                            <div className="text-right"><Clock className="w-4 h-4 ml-auto" /></div>
                        </div>

                        {/* Results List */}
                        <div className="space-y-1">
                            {searchResults.map((song, index) => {
                                const group = groups.find(g => g.id === song.group_id);
                                const isCurrent = currentSong?.id === song.id;
                                
                                return (
                                    <div
                                        key={song.id}
                                        onClick={() => handleSongClick(song)}
                                        className="group grid grid-cols-[40px_4fr_2fr_2fr_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition items-center cursor-pointer border-b border-transparent"
                                    >
                                        {/* Play State / Index */}
                                        <div className="flex items-center justify-center relative w-5">
                                            {isCurrent && isPlaying ? (
                                                <BarChart2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <>
                                                    <span className={clsx(
                                                        "font-mono text-gray-400 text-sm group-hover:hidden",
                                                        isCurrent && "text-emerald-500"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                    <Play className="w-4 h-4 text-white hidden group-hover:block fill-current" />
                                                </>
                                            )}
                                        </div>

                                        {/* Song Info with Cover */}
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 bg-[#282828] flex-shrink-0 rounded overflow-hidden relative shadow-sm">
                                                {song.cover_url ? (
                                                    <img 
                                                        src={song.cover_url} 
                                                        className="w-full h-full object-cover" 
                                                        alt={song.title} 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Music className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                )}
                                                {/* Overlay for currently playing (always visible) */}
                                                {isCurrent && isPlaying && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col overflow-hidden">
                                                <span className={clsx(
                                                    "font-medium truncate text-sm mb-0.5",
                                                    isCurrent ? "text-emerald-500" : "text-white"
                                                )}>
                                                    {song.title}
                                                </span>
                                                <span className="text-xs text-gray-400 truncate group-hover:text-white transition">
                                                    {song.artist}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Album */}
                                        <div className="text-sm text-gray-400 truncate group-hover:text-white transition">
                                            {song.album !== 'Unknown Album' ? song.album : <span className="opacity-50">-</span>}
                                        </div>

                                        {/* Vault Name */}
                                        <div className="text-sm text-gray-400">
                                            {group ? (
                                                <span className="truncate group-hover:text-white transition flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full inline-block bg-gradient-to-br ${group.color}`}></span>
                                                    {group.name}
                                                </span>
                                            ) : (
                                                <span className="opacity-50">Unknown Vault</span>
                                            )}
                                        </div>

                                        {/* Duration */}
                                        <div className="text-sm text-gray-400 font-mono text-right group-hover:text-white transition">
                                            {song.duration}
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

