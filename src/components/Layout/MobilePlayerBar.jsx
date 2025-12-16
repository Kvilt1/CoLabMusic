import React, { useState } from 'react';
import { Music2, Play, Pause, SkipForward, ChevronUp, Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import MobilePlayerSheet from './MobilePlayerSheet';

const MobilePlayerBar = () => {
    const { currentSong, isPlaying, togglePlay, nextSong, currentTime, duration } = usePlayer();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (!currentSong) return null;

    return (
        <>
            {/* Compact Player Bar */}
            <div
                onClick={() => setIsSheetOpen(true)}
                className="fixed bottom-16 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 z-30 md:hidden active:scale-[0.98] transition-transform cursor-pointer pb-safe"
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-black/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {currentSong.cover ? (
                                <img src={currentSong.cover} alt="Art" className="w-full h-full object-cover" />
                            ) : (
                                <Music2 className="text-white w-5 h-5" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                                {currentSong.title}
                            </div>
                            <div className="text-xs text-white/70 truncate">
                                {currentSong.artist}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="text-white p-2 active:scale-90 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-7 h-7 fill-current" />
                            ) : (
                                <Play className="w-7 h-7 fill-current" />
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                nextSong();
                            }}
                            className="text-white p-2 active:scale-90 transition-transform"
                        >
                            <SkipForward className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 bg-black/20">
                    <div
                        className="h-full bg-white/50 transition-all"
                        style={{
                            width: `${(currentTime / duration) * 100 || 0}%`
                        }}
                    />
                </div>
            </div>

            {/* Full Screen Player Sheet */}
            <MobilePlayerSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
        </>
    );
};

export default MobilePlayerBar;
