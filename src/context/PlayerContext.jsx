
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { groups as mockGroups, songs } from '../data/mockData';
import { Howl, Howler } from 'howler';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [currentView, setCurrentView] = useState('all');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Vaults State
    const [groups, setGroups] = useState(mockGroups);

    // Queue System
    const [queue, setQueue] = useState([]);
    const [userQueue, setUserQueue] = useState([]); // Manual "Add to Queue" list
    const [originalQueue, setOriginalQueue] = useState([]); // Keeps track of non-shuffled list
    const [queueIndex, setQueueIndex] = useState(-1); // Tracks position in the main queue
    const [isShuffled, setIsShuffled] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false); // UI Toggle
    const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: All, 2: One

    const soundRef = useRef(null);
    const rafRef = useRef(null);

    // Refs for auto-callbacks
    const queueRef = useRef(queue);
    const userQueueRef = useRef(userQueue);
    const queueIndexRef = useRef(queueIndex);
    const currentSongRef = useRef(currentSong);
    const repeatModeRef = useRef(repeatMode);

    useEffect(() => { queueRef.current = queue; }, [queue]);
    useEffect(() => { userQueueRef.current = userQueue; }, [userQueue]);
    useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
    useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
    useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

    // Global Volume
    useEffect(() => {
        Howler.volume(volume);
    }, [volume]);

    // Progress Loop
    useEffect(() => {
        const updateProgress = () => {
            if (soundRef.current && isPlaying) {
                const seek = soundRef.current.seek();
                setCurrentTime(seek || 0);
                rafRef.current = requestAnimationFrame(updateProgress);
            }
        };

        if (isPlaying) {
            rafRef.current = requestAnimationFrame(updateProgress);
        } else {
            cancelAnimationFrame(rafRef.current);
        }

        return () => cancelAnimationFrame(rafRef.current);
    }, [isPlaying]);

    // Helpers
    const getFilteredSongs = () => {
        return currentView === 'all'
            ? songs
            : songs.filter(s => s.group === currentView);
    };

    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    const addToQueue = (song) => {
        setUserQueue([...userQueue, song]);
    };

    const playSong = (song) => {
        if (currentSong?.id === song.id && soundRef.current) {
            togglePlay();
            return;
        }

        // Initialize queue if starting from a list view (Context Switch)
        // Reset User Queue on new context play? Standard behavior is varying.
        // For simplicity, let's KEEP user queue but reset the main context.

        const viewSongs = getFilteredSongs();
        setOriginalQueue(viewSongs);

        let newQueue;
        if (isShuffled) {
            const otherSongs = viewSongs.filter(s => s.id !== song.id);
            newQueue = [song, ...shuffleArray(otherSongs)];
        } else {
            newQueue = viewSongs;
        }

        setQueue(newQueue);

        // Update index
        const newIndex = newQueue.findIndex(s => s.id === song.id);
        setQueueIndex(newIndex);

        _playInternal(song);
    };

    const _playInternal = (song) => {
        if (soundRef.current) {
            soundRef.current.unload();
        }

        setCurrentSong(song);
        setIsPlaying(true);
        setCurrentTime(0);

        const sound = new Howl({
            src: [song.url || ''],
            html5: true,
            volume: volume,
            onend: () => {
                nextSong(true);
            },
            onload: () => {
                setDuration(sound.duration());
            },
            onloaderror: (id, err) => {
                console.error("Load Error:", err);
            },
            onplayerror: (id, err) => {
                console.error("Play Error:", err);
                sound.once('unlock', function () {
                    sound.play();
                });
            }
        });

        soundRef.current = sound;
        sound.play();
    };

    const togglePlay = () => {
        if (!soundRef.current) return;

        if (isPlaying) {
            soundRef.current.pause();
            setIsPlaying(false);
        } else {
            soundRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleShuffle = () => {
        const newShuffleState = !isShuffled;
        setIsShuffled(newShuffleState);

        if (newShuffleState) {
            // Turning shuffle ON
            // Keep current song first, shuffle the rest of the ORIGINAL queue
            if (currentSong) {
                const otherSongs = originalQueue.filter(s => s.id !== currentSong.id);
                // Fallback if currentSong isn't in originalQueue (e.g. view changed)
                // But typically originalQueue tracks the current context.
                setQueue([currentSong, ...shuffleArray(otherSongs)]);
            } else {
                setQueue(shuffleArray(originalQueue));
            }
        } else {
            // Turning shuffle OFF
            setQueue(originalQueue);
        }
    };

    const toggleRepeat = () => {
        setRepeatMode(prev => (prev + 1) % 3);
    };

    const toggleQueue = () => {
        setIsQueueOpen(!isQueueOpen);
    };


    const seek = (time) => {
        if (soundRef.current) {
            soundRef.current.seek(time);
            setCurrentTime(time);
        }
    };

    const switchView = (viewId) => {
        setCurrentView(viewId);
    };

    // Need to use refs or functional updates for auto-advance if closure is stale?
    // Actually Context re-renders on state change, providing fresh functions.
    // BUT Howler 'onend' closure captures the state at creation time of the Howl object.
    // We need a stable reference or to rely on finding the song in the *current* queue via state.
    // PROBLEM: 'onend' callback defines 'nextSong' from the render scope where 'playSong' was called.
    // If we rely on Howl's onEnd calling a function, that function better check the REF of the queue.

    // workaround: use a ref to hold the latest queue for the onend callback
    // const queueRef = useRef(queue);
    // useEffect(() => { queueRef.current = queue; }, [queue]);
    // const currentSongRef = useRef(currentSong);
    // useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);


    const nextSong = (auto = false) => {
        const activeQueue = queueRef.current;
        const activeUserQueue = userQueueRef.current;
        const activeIndex = queueIndexRef.current;
        const activeRepeat = repeatModeRef.current;

        // 1. Check User Queue (Priority)
        if (activeUserQueue.length > 0) {
            const nextS = activeUserQueue[0];
            // Remove from user queue
            setUserQueue(prev => prev.slice(1));
            // Just play it, don't update main queue index
            _playInternal(nextS);
            return;
        }

        // 2. Main Queue
        if (activeQueue.length === 0) return;

        // Repeat One (only if auto-advancing, manual next skips)
        if (auto && activeRepeat === 2 && currentSongRef.current) {
            _playInternal(currentSongRef.current);
            return;
        }

        // Calculate next index
        let nextIndex = activeIndex + 1;

        // End of queue check
        if (nextIndex >= activeQueue.length) {
            if (activeRepeat === 1) {
                nextIndex = 0; // Wrap
            } else {
                // Repeat Off: Stop
                // But if manual next, we usually wrap or stop?
                // Let's wrap if manual, stop if auto?
                if (auto) {
                    setIsPlaying(false);
                    if (soundRef.current) {
                        soundRef.current.stop();
                        seek(0);
                    }
                    return;
                } else {
                    nextIndex = 0; // Manual next loop
                }
            }
        }

        setQueueIndex(nextIndex);
        _playInternal(activeQueue[nextIndex]);
    };

    const prevSong = () => {
        if (currentTime > 3 && soundRef.current) {
            seek(0);
            return;
        }

        // Previous logic is simple: go back in main queue.
        // If we were playing a User Queue song, where do we go?
        // Ideally, go back to the prev song in main queue?
        // Or Restart song?

        const activeQueue = queue;
        const activeIndex = queueIndex;

        if (activeQueue.length === 0) return;

        const prevIndex = (activeIndex - 1 + activeQueue.length) % activeQueue.length;
        setQueueIndex(prevIndex);
        _playInternal(activeQueue[prevIndex]);
    };

    const addVault = (name, coverImage) => {
        const newVault = {
            id: `v-${Date.now()}`,
            name: name,
            color: 'from-gray-700 to-gray-900', // Default styling
            text: 'text-gray-300',
            border: 'border-gray-600/30',
            bg_hex: '#333333',
            coverUrl: coverImage
        };
        setGroups([...groups, newVault]);
        // Optionally switch to new vault immediately
        // setCurrentView(newVault.id);
    };

    const filteredSongs = getFilteredSongs(); // For display in main list
    const currentGroup = currentView === 'all'
        ? null
        : groups.find(g => g.id === currentView);

    const value = {
        isPlaying,
        currentSong,
        volume,
        setVolume,
        playSong,
        togglePlay,
        currentView,
        switchView,
        groups,
        songs: filteredSongs,
        currentGroup,
        currentTime,
        duration,
        seek,
        nextSong,
        prevSong,

        // New Exports
        queue,
        userQueue,
        addToQueue,

        isShuffled,
        toggleShuffle,
        isQueueOpen,
        toggleQueue,
        repeatMode,
        toggleRepeat,

        addVault
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};
