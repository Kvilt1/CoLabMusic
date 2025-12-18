import React from 'react';
import { Music2, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, ListMusic, Volume2, Maximize2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import clsx from 'clsx';

const PlayerBar = () => {
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
        isQueueOpen,
        toggleQueue,
        repeatMode,
        toggleRepeat
    } = usePlayer();

    const [isDragging, setIsDragging] = React.useState(false);
    const [dragValue, setDragValue] = React.useState(0);
    const [isHovering, setIsHovering] = React.useState(false);

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
    const progressPercent = (displayTime / (duration || 1)) * 100;

    return (
        <div 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-fade-in"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="bg-dark-800/90 backdrop-blur-xl border border-white/10 rounded-full p-2 pr-6 shadow-2xl flex items-center justify-between group relative overflow-hidden transition-all duration-300 hover:border-orange-500/30">
                
                {/* Progress Bar (Bottom Line) */}
                <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-orange-500/50 z-10 transition-all duration-100 ease-linear" 
                    style={{ width: `${progressPercent}%` }}
                />
                
                {/* Left: Song Info */}
                <div className="flex items-center gap-4 w-[30%] min-w-0">
                    <div className="w-12 h-12 bg-dark-900 rounded-full flex-shrink-0 border border-white/10 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                        {(currentSong.cover_url || currentSong.cover) ? (
                            <img src={currentSong.cover_url || currentSong.cover} alt="Art" className={clsx("w-full h-full object-cover", isPlaying && "animate-spin-slow")} style={{ animationDuration: '8s' }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-700">
                                <Music2 className="text-gray-500 w-5 h-5" />
                            </div>
                        )}
                        {/* Overlay Play/Pause on hover of art could go here */}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold text-white truncate cursor-default group-hover:text-orange-500 transition-colors">{currentSong.title}</div>
                        <div className="text-xs text-gray-400 truncate cursor-default">{currentSong.artist}</div>
                    </div>
                </div>

                {/* Center: Controls */}
                <div className="flex items-center gap-4 flex-1 justify-center">
                    <button
                        onClick={toggleShuffle}
                        className={clsx("transition p-2 rounded-full hover:bg-white/5", isShuffled ? 'text-orange-500' : 'text-gray-400 hover:text-white')}
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button onClick={prevSong} className="text-gray-300 hover:text-white transition p-2 hover:bg-white/5 rounded-full"><SkipBack className="w-5 h-5 fill-current" /></button>
                    
                    <button 
                        onClick={togglePlay} 
                        className="bg-white text-black rounded-full p-3 hover:scale-105 active:scale-95 transition shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,85,0,0.5)] hover:bg-orange-500 hover:text-white"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </button>
                    
                    <button onClick={nextSong} className="text-gray-300 hover:text-white transition p-2 hover:bg-white/5 rounded-full"><SkipForward className="w-5 h-5 fill-current" /></button>
                    <button
                        onClick={toggleRepeat}
                        className={clsx("transition p-2 rounded-full hover:bg-white/5 relative", repeatMode !== 0 ? 'text-orange-500' : 'text-gray-400 hover:text-white')}
                    >
                        <Repeat className="w-4 h-4" />
                        {repeatMode === 2 && (
                            <span className="absolute top-1.5 right-1.5 text-[6px] font-bold bg-orange-500 text-black px-0.5 rounded-full leading-none">1</span>
                        )}
                    </button>
                </div>

                {/* Right: Volume & Tools */}
                <div className="flex items-center justify-end gap-3 w-[30%] min-w-0">
                    <div className="text-xs font-mono text-gray-500 w-16 text-right hidden md:block">
                        {formatTime(displayTime)}
                    </div>
                    
                    <div className="flex items-center gap-2 group/vol">
                        <Volume2 className="w-4 h-4 text-gray-400 group-hover/vol:text-white transition" />
                        <div className="w-20 h-1 bg-dark-600 rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-white group-hover/vol:bg-orange-500 transition-colors"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

                    <button
                        onClick={toggleQueue}
                        className={clsx("p-2 rounded-full hover:bg-white/10 transition", isQueueOpen ? 'text-orange-500 bg-white/10' : 'text-gray-400 hover:text-white')}
                    >
                        <ListMusic className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Seek Bar Overlay (Invisible but clickable on whole bottom area) */}
                 <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={displayTime}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    className="absolute bottom-0 left-0 w-full h-1.5 opacity-0 hover:opacity-100 cursor-pointer z-20"
                    style={{ background: 'transparent' }}
                />
            </div>
        </div>
    );
};

export default PlayerBar;
