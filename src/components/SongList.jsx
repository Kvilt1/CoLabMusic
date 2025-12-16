import React from 'react';
import { Play, BarChart2, Music, Search } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
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
    const { songs, isPlaying, currentSong, playSong, currentView, groups, switchView, listSearchQuery, setListSearchQuery } = usePlayer();

    return (
        <div className="flex flex-col pb-32">
            {/* Table Header */}
            <div className="sticky top-[64px] bg-[#121212] z-10 grid grid-cols-[40px_4fr_2fr_2fr_1fr_40px] gap-4 text-gray-400 text-xs border-b border-[#282828] pb-2 mb-4 px-4 uppercase font-bold tracking-wider">
                <div className="text-center">#</div>
                <div>Title</div>
                <div>Album</div>
                <div>Date Added</div>
                <div>Vault</div>
            </div>

            {songs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500 animate-fade-in">
                    {listSearchQuery ? (
                        <>
                            <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 shadow-lg">
                                <Search className="w-8 h-8 opacity-50 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">No matches found</h3>
                            <p className="text-sm text-gray-400 mb-6">We couldn't find any songs matching "{listSearchQuery}"</p>
                            <button 
                                onClick={() => setListSearchQuery('')} 
                                className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition shadow-lg text-sm"
                            >
                                Clear filter
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6">
                                <Music className="w-8 h-8 opacity-50 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">It's a bit quiet here</h3>
                            <p className="text-sm text-gray-400 mb-6">This vault doesn't have any songs yet.</p>
                            <button 
                                onClick={onUpload} 
                                className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 hover:scale-105 transition shadow-lg text-sm"
                            >
                                Upload Music
                            </button>
                        </>
                    )}
                </div>
            ) : (
                songs.map((song, index) => {
                    const group = groups.find(g => g.id === song.group_id);
                    const isCurrent = currentSong?.id === song.id;

                    return (
                        <div
                            key={song.id}
                            onClick={() => playSong(song)}
                            className="group grid grid-cols-[40px_4fr_2fr_2fr_1fr_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition items-center text-sm text-gray-400 border-b border-transparent hover:border-transparent cursor-pointer relative"
                        >
                            {/* Index / Play Btn */}
                            <div className="flex items-center justify-center relative w-5">
                                <span className={clsx("font-mono", isCurrent && isPlaying ? "text-emerald-500 hidden" : "group-hover:hidden text-gray-500")}>
                                    {isCurrent && isPlaying ? "" : index + 1}
                                </span>

                                {/* Play Icon (Hover) */}
                                <Play className={clsx("w-4 h-4 fill-white text-white absolute left-0.5 hidden group-hover:block", isCurrent && isPlaying && "!hidden")} />

                                {/* Playing Icon (Active) */}
                                {isCurrent && isPlaying && <BarChart2 className="w-4 h-4 text-emerald-500 block" />}
                            </div>

                            {/* Title/Image */}
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 bg-[#333] flex-shrink-0 rounded flex items-center justify-center relative overflow-hidden">
                                    {song.cover_url ? (
                                        <img src={song.cover_url} className="w-full h-full object-cover" alt="Art" />
                                    ) : (
                                        <Music className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={clsx("font-medium truncate mb-0.5 hover:underline decoration-white/50", isCurrent ? "text-emerald-500" : "text-white")}>
                                        {song.title}
                                    </span>
                                    <span className="text-xs group-hover:text-white transition truncate hover:underline decoration-white/50">
                                        {song.artist}
                                    </span>
                                </div>
                            </div>

                            {/* Album */}
                            <div className="truncate group-hover:text-white transition hover:underline decoration-white/50">{song.album}</div>

                            {/* Date */}
                            <div 
                                className="truncate group-hover:text-white transition cursor-default"
                                title={formatFullDate(song.created_at)}
                            >
                                {formatRelativeTime(song.created_at)}
                            </div>

                            {/* Vault */}
                            <div className="flex items-center gap-2 truncate">
                                <button className="hover:text-white hover:underline truncate" onClick={(e) => { e.stopPropagation(); switchView(group?.id || 'all'); }}>
                                    {group?.name || 'Unknown'}
                                </button>
                            </div>

                            {/* Duration / Menu */}
                            <div className="text-right font-mono text-xs group-hover:hidden">
                                {song.duration}
                            </div>
                            <div className="hidden group-hover:flex justify-end">
                                <SongMenu song={song} />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default SongList;
