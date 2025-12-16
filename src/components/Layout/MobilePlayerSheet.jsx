import React, { useEffect } from 'react';
import { ChevronDown, Heart, MoreHorizontal, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Volume2, ListMusic } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import clsx from 'clsx';

const MobilePlayerSheet = ({ isOpen, onClose }) => {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        volume,
        setVolume,
        currentTime,
        duration,
        seek,
        nextSong,
        prevSong,
        isShuffled,
        toggleShuffle,
        repeatMode,
        toggleRepeat,
        toggleQueue
    } = usePlayer();

    const [isDragging, setIsDragging] = React.useState(false);
    const [dragValue, setDragValue] = React.useState(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!currentSong) return null;

    const handleSeekChange = (e) => {
        setIsDragging(true);
        setDragValue(parseFloat(e.target.value));
    };

    const handleSeekEnd = () => {
        setIsDragging(false);
        seek(dragValue);
    };

    const formatTime = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayTime = isDragging ? dragValue : currentTime;

    return (
        <div
            className={clsx(
                "fixed inset-0 bg-gradient-to-b from-emerald-600 via-emerald-700 to-[#121212] z-50 transition-transform duration-500 md:hidden",
                isOpen ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="flex flex-col h-full px-6 pt-safe">
                {/* Header */}
                <div className="flex items-center justify-between py-4">
                    <button
                        onClick={onClose}
                        className="text-white p-2 active:scale-90 transition-transform -ml-2"
                    >
                        <ChevronDown className="w-7 h-7" />
                    </button>
                    <div className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                        Now Playing
                    </div>
                    <button className="text-white p-2 active:scale-90 transition-transform -mr-2">
                        <MoreHorizontal className="w-6 h-6" />
                    </button>
                </div>

                {/* Album Art */}
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-full max-w-sm aspect-square rounded-lg shadow-2xl overflow-hidden bg-black/20">
                        {currentSong.cover ? (
                            <img
                                src={currentSong.cover}
                                alt={currentSong.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="text-6xl">🎵</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Song Info */}
                <div className="py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white truncate mb-1">
                                {currentSong.title}
                            </h1>
                            <p className="text-base text-white/70 truncate">
                                {currentSong.artist}
                            </p>
                        </div>
                        <button className="text-white/70 active:text-emerald-400 p-2 active:scale-90 transition-all">
                            <Heart className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="py-4">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={displayTime}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekEnd}
                        onTouchEnd={handleSeekEnd}
                        style={{
                            backgroundSize: `${(displayTime / (duration || 1)) * 100}% 100%`
                        }}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb-white"
                    />
                    <div className="flex justify-between text-xs text-white/70 mt-2 font-mono">
                        <span>{formatTime(displayTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="py-6">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={toggleShuffle}
                            className={clsx(
                                "p-2 active:scale-90 transition-all",
                                isShuffled ? "text-emerald-400" : "text-white/60"
                            )}
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-6">
                            <button
                                onClick={prevSong}
                                className="text-white p-2 active:scale-90 transition-transform"
                            >
                                <SkipBack className="w-8 h-8 fill-current" />
                            </button>
                            
                            <button
                                onClick={togglePlay}
                                className="bg-white rounded-full p-5 text-black active:scale-95 transition-transform shadow-xl"
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current ml-1" />
                                )}
                            </button>
                            
                            <button
                                onClick={nextSong}
                                className="text-white p-2 active:scale-90 transition-transform"
                            >
                                <SkipForward className="w-8 h-8 fill-current" />
                            </button>
                        </div>
                        
                        <button
                            onClick={toggleRepeat}
                            className={clsx(
                                "p-2 active:scale-90 transition-all relative",
                                repeatMode !== 0 ? "text-emerald-400" : "text-white/60"
                            )}
                        >
                            <Repeat className="w-5 h-5" />
                            {repeatMode === 2 && (
                                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-emerald-400 text-black px-1 rounded-full">
                                    1
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Volume & Queue */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Volume2 className="w-5 h-5 text-white/60" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                style={{
                                    backgroundSize: `${volume * 100}% 100%`
                                }}
                                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb-white"
                            />
                        </div>
                        <button
                            onClick={toggleQueue}
                            className="text-white/60 active:text-white p-2 active:scale-90 transition-all"
                        >
                            <ListMusic className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="pb-safe"></div>
            </div>
        </div>
    );
};

export default MobilePlayerSheet;
