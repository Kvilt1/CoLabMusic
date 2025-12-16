import React from 'react';
import { Play, BarChart2, Heart, Clock, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import SongMenu from './SongMenu';
import clsx from 'clsx';

const SongList = ({ onUpload }) => {
    const { songs, isPlaying, currentSong, playSong, groups, switchView } = usePlayer();

    return (
        <div className="flex flex-col pb-32">
            {/* Desktop Table Header */}
            <div className="hidden md:grid sticky top-[64px] bg-[#121212] z-10 grid-cols-[40px_4fr_2fr_2fr_1fr_40px] gap-4 text-gray-400 text-xs border-b border-[#282828] pb-2 mb-4 px-4 uppercase font-bold tracking-wider">
                <div className="text-center">#</div>
                <div>Title</div>
                <div>Album</div>
                <div>Date Added</div>
                <div>Vault</div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden sticky top-[56px] bg-[#121212] z-10 text-gray-400 text-xs border-b border-[#282828] pb-2 mb-2 px-4 uppercase font-bold tracking-wider">
                Songs
            </div>

            {songs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Music className="w-12 h-12 mb-4 opacity-50" />
                    <p>No songs here yet.</p>
                    <button onClick={onUpload} className="mt-4 text-white font-bold hover:underline active:scale-95 transition">Upload something?</button>
                </div>
            ) : (
                songs.map((song, index) => {
                    const group = groups.find(g => g.id === song.group_id);
                    const isCurrent = currentSong?.id === song.id;

                    return (
                        <React.Fragment key={song.id}>
                            {/* Desktop Row */}
                            <div
                                onClick={() => playSong(song)}
                                className="hidden md:grid group grid-cols-[40px_4fr_2fr_2fr_1fr_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition items-center text-sm text-gray-400 border-b border-transparent hover:border-transparent cursor-pointer relative"
                            >
                                {/* Index / Play Btn */}
                                <div className="flex items-center justify-center relative w-5">
                                    <span className={clsx("font-mono", isCurrent && isPlaying ? "text-emerald-500 hidden" : "group-hover:hidden text-gray-500")}>
                                        {isCurrent && isPlaying ? "" : index + 1}
                                    </span>
                                    <Play className={clsx("w-4 h-4 fill-white text-white absolute left-0.5 hidden group-hover:block", isCurrent && isPlaying && "!hidden")} />
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

                                <div className="truncate group-hover:text-white transition hover:underline decoration-white/50">{song.album}</div>
                                <div className="truncate group-hover:text-white transition">2 weeks ago</div>
                                <div className="flex items-center gap-2 truncate">
                                    <button className="hover:text-white hover:underline truncate" onClick={(e) => { e.stopPropagation(); switchView(group?.id || 'all'); }}>
                                        {group?.name || 'Unknown'}
                                    </button>
                                </div>
                                <div className="text-right font-mono text-xs group-hover:hidden">
                                    {song.duration}
                                </div>
                                <div className="hidden group-hover:flex justify-end">
                                    <SongMenu song={song} />
                                </div>
                            </div>

                            {/* Mobile Row */}
                            <div
                                onClick={() => playSong(song)}
                                className="md:hidden flex items-center gap-3 px-4 py-3 active:bg-white/10 transition cursor-pointer"
                            >
                                {/* Album Art */}
                                <div className="w-12 h-12 bg-[#333] flex-shrink-0 rounded flex items-center justify-center relative overflow-hidden">
                                    {song.cover_url ? (
                                        <img src={song.cover_url} className="w-full h-full object-cover" alt="Art" />
                                    ) : (
                                        <Music className="w-5 h-5 text-gray-500" />
                                    )}
                                    {isCurrent && isPlaying && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <BarChart2 className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className={clsx("font-medium truncate text-sm", isCurrent ? "text-emerald-500" : "text-white")}>
                                        {song.title}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {song.artist}
                                    </div>
                                </div>

                                {/* Menu */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <SongMenu song={song} />
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })
            )}
        </div>
    );
};

export default SongList;
