import React from 'react';
import { Play, BarChart2, Music, Search, Clock, Calendar } from 'lucide-react';
import { useApp, useVaults, useAudioContext } from '../context';
import { useSongOperations } from '../hooks';
import SongMenu from './SongMenu';
import clsx from 'clsx';

// Format date as relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

// Format date for hover tooltip
const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const SongList = ({ onUpload }) => {
    const { currentView, switchView, listSearchQuery, setListSearchQuery } = useApp();
    const { vaults, allSongs } = useVaults();
    const { isPlaying, currentSong, playSong } = useAudioContext();
    const songOps = useSongOperations();

    // Compute filtered songs for current view
    const songs = songOps.getFilteredSongs(allSongs, currentView, listSearchQuery);

    return (
        <div className="flex flex-col pb-40 px-8">
            {/* Table Header */}
            <div className="sticky top-[72px] bg-dark-900 z-10 grid grid-cols-[40px_4fr_2fr_1fr_40px] gap-4 text-gray-500 text-xs font-bold tracking-wider uppercase border-b border-white/5 pb-3 mb-2 px-4 transition-colors">
                <div className="text-center">#</div>
                <div className="flex items-center gap-1">Title</div>
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</div>
                <div className="flex items-center gap-1">Vault</div>
                <div className="flex justify-end"><Clock className="w-3 h-3" /></div>
            </div>

            {songs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500 animate-fade-in">
                    {listSearchQuery ? (
                        <>
                            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/5">
                                <Search className="w-10 h-10 opacity-50 text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-white">No matches found</h3>
                            <p className="text-base text-gray-400 mb-8">We couldn't find any songs matching "{listSearchQuery}"</p>
                            <button 
                                onClick={() => setListSearchQuery('')} 
                                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 hover:bg-orange-500 hover:text-white transition shadow-lg text-sm"
                            >
                                Clear filter
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/5">
                                <Music className="w-12 h-12 opacity-50 text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">It's a bit quiet here</h3>
                            <p className="text-base text-gray-400 mb-8 max-w-md text-center">This vault is waiting for its first track. Upload some music to get the party started.</p>
                            <button 
                                onClick={onUpload} 
                                className="px-8 py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-400 hover:scale-105 transition shadow-[0_4px_20px_rgba(255,85,0,0.3)] text-sm tracking-wide"
                            >
                                Upload Music
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-1">
                    {songs.map((song, index) => {
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
                                onClick={() => playSong(song, songs)}
                                className={clsx(
                                    "group grid grid-cols-[40px_4fr_2fr_1fr_40px] gap-4 px-4 py-3 rounded-xl transition items-center text-sm cursor-pointer relative border border-transparent",
                                    isCurrent
                                        ? "bg-white/5 border-orange-500/20 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                                        : "hover:bg-white/5 hover:border-white/5"
                                )}
                            >
                                {/* Index / Play Btn */}
                                <div className="flex items-center justify-center relative w-5">
                                    <span className={clsx("font-mono transition-all duration-200", isCurrent && isPlaying ? "hidden" : "group-hover:hidden text-gray-500", isCurrent && !isPlaying && "text-orange-500 font-bold")}>
                                        {index + 1}
                                    </span>

                                    {/* Play Icon (Hover) */}
                                    <Play className={clsx("w-4 h-4 fill-white text-white absolute left-0.5 hidden group-hover:block transition-all", isCurrent && isPlaying && "!hidden")} />

                                    {/* Playing Icon (Active) */}
                                    {isCurrent && isPlaying && <BarChart2 className="w-4 h-4 text-orange-500 block animate-pulse" />}
                                </div>

                                {/* Title/Image */}
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 bg-dark-800 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-md group-hover:shadow-orange-500/10 transition-shadow">
                                        {song.cover_url ? (
                                            <img src={song.cover_url} className="w-full h-full object-cover" alt="Art" />
                                        ) : (
                                            <Music className="w-5 h-5 text-gray-600" />
                                        )}
                                        {isCurrent && (
                                            <div className="absolute inset-0 bg-orange-500/20 ring-1 ring-inset ring-orange-500/50"></div>
                                        )}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className={clsx("font-bold truncate mb-0.5 transition-colors", isCurrent ? "text-orange-500" : "text-white group-hover:text-white")}>
                                            {song.title}
                                        </span>
                                        <span className="text-xs text-gray-400 group-hover:text-white transition truncate">
                                            {song.artist}
                                        </span>
                                    </div>
                                </div>

                                {/* Date */}
                                <div 
                                    className="truncate text-gray-400 group-hover:text-white transition cursor-default"
                                    title={formatFullDate(song.created_at)}
                                >
                                    {formatRelativeTime(song.created_at)}
                                </div>

                                {/* Vault */}
                                <div className="flex items-center gap-2 truncate">
                                    <button 
                                        className="text-gray-400 hover:text-orange-500 hover:underline truncate transition" 
                                        onClick={(e) => { e.stopPropagation(); switchView(group?.id || 'all'); }}
                                    >
                                        {group?.name || 'Unknown'}
                                    </button>
                                </div>

                                {/* Duration / Menu */}
                                <div className="text-right font-mono text-xs text-gray-500 group-hover:hidden">
                                    {formatDuration(song.duration_seconds || song.duration)}
                                </div>
                                <div className="hidden group-hover:flex justify-end">
                                    <SongMenu song={song} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SongList;
