import React from 'react';
import { Music2, ChevronUp, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Mic2, ListMusic, MonitorSpeaker, Volume2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

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

    if (!currentSong) return null;

    const [isDragging, setIsDragging] = React.useState(false);
    const [dragValue, setDragValue] = React.useState(0);

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

    // Use dragValue when dragging, otherwise actual currentTime
    const displayTime = isDragging ? dragValue : currentTime;

    return (
        <footer className="fixed bottom-0 left-0 right-0 h-[90px] bg-[#181818] border-t border-[#282828] px-4 flex items-center justify-between z-50 transition-transform duration-300">
            {/* Now Playing */}
            <div className="flex items-center gap-4 w-[30%]">
                <div className="w-14 h-14 bg-gray-800 rounded shadow-lg flex items-center justify-center flex-shrink-0 border border-white/10 relative group cursor-pointer overflow-hidden">
                    {currentSong.cover ? (
                        <img src={currentSong.cover} alt="Art" className="w-full h-full object-cover" />
                    ) : (
                        <Music2 className="text-gray-500" />
                    )}
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded">
                        <ChevronUp className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="overflow-hidden">
                    <div className="text-sm font-semibold text-white hover:underline cursor-pointer truncate">{currentSong.title}</div>
                    <div className="text-xs text-gray-400 hover:text-white hover:underline cursor-pointer truncate transition">{currentSong.artist}</div>
                </div>
                <button className="text-gray-400 hover:text-emerald-500 transition ml-2"><Heart className="w-4 h-4" /></button>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center w-[40%] max-w-2xl">
                <div className="flex items-center gap-6 mb-1">
                    <button
                        onClick={toggleShuffle}
                        className={`transition ${isShuffled ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button onClick={prevSong} className="text-gray-300 hover:text-white transition"><SkipBack className="w-5 h-5 fill-current" /></button>
                    <button onClick={togglePlay} className="bg-white rounded-full p-2 text-black hover:scale-105 transition shadow-lg">
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </button>
                    <button onClick={nextSong} className="text-gray-300 hover:text-white transition"><SkipForward className="w-5 h-5 fill-current" /></button>
                    <button
                        onClick={toggleRepeat}
                        className={`transition relative ${repeatMode !== 0 ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Repeat className="w-4 h-4" />
                        {repeatMode === 2 && (
                            <span className="absolute -top-1.5 -right-1 text-[8px] font-bold bg-[#181818] px-0.5 rounded-full">1</span>
                        )}
                    </button>
                </div>
                <div className="w-full flex items-center gap-2 text-xs text-gray-400 font-mono range-group">
                    <span>{formatTime(displayTime)}</span>
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
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Tools */}
            <div className="flex items-center justify-end gap-3 w-[30%]">
                <button className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-[#282828] transition"><Mic2 className="w-4 h-4" /></button>
                <button
                    onClick={toggleQueue}
                    className={`p-2 rounded-md hover:bg-[#282828] transition ${isQueueOpen ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <ListMusic className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-[#282828] transition"><MonitorSpeaker className="w-4 h-4" /></button>
                <div className="flex items-center gap-2 w-32 range-group ml-2">
                    <Volume2 className="w-4 h-4 text-gray-400" />
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
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                </div>
            </div>
        </footer>
    );
};

export default PlayerBar;
