
import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { supabase } from '../supabaseClient';

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
    const [groups, setGroups] = useState([]);
    const [allSongs, setAllSongs] = useState([]);

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

    // Data Fetching & Realtime
    useEffect(() => {
        const fetchData = async () => {
            const { data: vaultsData } = await supabase.from('vaults').select('*').order('created_at', { ascending: true });
            if (vaultsData) setGroups(vaultsData);

            const { data: songsData } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
            if (songsData) setAllSongs(songsData);
        };

        fetchData();

        // Realtime Subscription
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vaults' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setGroups(prev => {
                            if (prev.some(g => g.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setGroups(prev => prev.filter(g => g.id !== payload.old.id));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'songs' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setAllSongs(prev => [payload.new, ...prev]);
                    } // Handle other events if needed
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Circular dependency breaker
    const nextSongRef = useRef(null);

    const _playInternal = useCallback((song) => {
        if (soundRef.current) {
            soundRef.current.unload();
        }

        const sound = new Howl({
            src: [song.url],
            html5: true,
            volume: volume,
            onplay: () => setIsPlaying(true),
            onpause: () => setIsPlaying(false),
            onend: () => {
                setIsPlaying(false);
                if (nextSongRef.current) nextSongRef.current();
            },
            onloaderror: (id, err) => console.error('Load Error:', err),
            onplayerror: (id, err) => {
                sound.once('unlock', () => {
                    sound.play();
                });
            }
        });

        soundRef.current = sound;
        setCurrentSong(song);
        sound.play();

        if (sound.state() === 'loaded') {
            setDuration(sound.duration());
        } else {
            sound.once('load', () => {
                setDuration(sound.duration());
            });
        }
    }, [volume]);

    const togglePlay = useCallback(() => {
        if (soundRef.current) {
            if (isPlaying) {
                soundRef.current.pause();
            } else {
                soundRef.current.play();
            }
        } else if (queue.length > 0 && queueIndex >= 0) {
            _playInternal(queue[queueIndex]);
        } else if (queue.length > 0 && queueIndex === -1) {
            setQueueIndex(0);
            _playInternal(queue[0]);
        }
    }, [isPlaying, queue, queueIndex, _playInternal]);

    const nextSong = useCallback(() => {
        const currentQ = queueRef.current;
        const currentIdx = queueIndexRef.current;
        const mode = repeatModeRef.current;

        if (currentQ.length === 0) return;

        let nextIdx = currentIdx + 1;
        if (nextIdx >= currentQ.length) {
            if (mode === 1 || mode === 2) {
                nextIdx = 0;
            } else {
                setIsPlaying(false);
                return;
            }
        }

        setQueueIndex(nextIdx);
        _playInternal(currentQ[nextIdx]);
    }, [_playInternal]);

    const prevSong = useCallback(() => {
        const currentQ = queueRef.current;
        const currentIdx = queueIndexRef.current;
        const sound = soundRef.current;

        if (sound && sound.seek() > 3) {
            sound.seek(0);
            return;
        }

        let prevIdx = currentIdx - 1;
        if (prevIdx < 0) {
            if (currentQ.length > 0) prevIdx = currentQ.length - 1;
            else prevIdx = 0;
        }

        setQueueIndex(prevIdx);
        if (currentQ[prevIdx]) {
            _playInternal(currentQ[prevIdx]);
        }
    }, [_playInternal]);

    useEffect(() => { nextSongRef.current = nextSong; }, [nextSong]);

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

    // Keyboard Shortcuts (Spacebar)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                const activeTag = document.activeElement.tagName;
                // Don't toggle if typing in input/textarea
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

                e.preventDefault(); // Prevent scrolling
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]); // Re-attach when togglePlay changes

    // Media Session API (Hardware Keys)
    useEffect(() => {
        if ('mediaSession' in navigator) {
            // Update Metadata
            if (currentSong && 'MediaMetadata' in window) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: currentSong.title,
                    artist: currentSong.artist || 'Unknown Artist',
                    album: currentSong.album || 'Unknown Album',
                    artwork: [
                        { src: currentSong.cover || '', sizes: '512x512', type: 'image/png' }
                    ]
                });
            }

            // Action Handlers
            navigator.mediaSession.setActionHandler('play', () => {
                // Ensure we are playing
                if (!isPlaying) togglePlay();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (isPlaying) togglePlay();
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
            navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
        }
    }, [currentSong, isPlaying, togglePlay, nextSong, prevSong]);


    // Helpers
    // Helpers
    const getFilteredSongs = useCallback(() => {
        return currentView === 'all'
            ? allSongs
            : allSongs.filter(s => s.group_id === currentView);
    }, [currentView, allSongs]);

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

    const playSong = useCallback((song) => {
        if (currentSongRef.current?.id === song.id && soundRef.current) {
            togglePlay();
            return;
        }

        // Initialize queue if starting from a list view (Context Switch)
        // Reset User Queue on new context play? Standard behavior is varying.
        // For simplicity, let's KEEP user queue but reset the main context.

        const viewSongs = getFilteredSongs();
        setOriginalQueue(viewSongs);

        let newQueue;
        // Access state directly here as it's an event handler
        // But need to ensure 'isShuffled' is stable or in dep array.
        // We can use the ref 'isPlaying' etc if needed, but 'isShuffled' isn't ref'd yet.
        // Let's add isShuffled to deps.
        // Wait, playSong depends on isShuffled, currentView, songs.

        // Simpler: Just reconstruct queue.
        // Re-implement shuffle logic here to avoid complex deps?
        // Or just let it depend on isShuffled.

        // We need a stable reference to 'isShuffled' to avoid re-creating playSong too often?
        // Actually, re-creating playSong on View change is fine.

        // But to make it cleaner, let's read the current state.

        // NOTE: We're inside a component, so we can use the state directly.
        // We just list dependencies.

        // Re-check shuffle state
        // We'll use the 'isShuffled' from scope.
        // But we need to make sure we don't have stale closure issues if called from async.
        // It's called from click handlers, so it's fine.

        // We need to duplicate the logic of getFilteredSongs inside or call it.
        // calling getFilteredSongs() is fine.

        const songsList = getFilteredSongs();

        // Check shuffle logic again - creating a dependency on shuffle logic
        const shouldShuffle = isShuffled; // capture current state

        if (shouldShuffle) {
            const otherSongs = songsList.filter(s => s.id !== song.id);
            // We need shuffleArray function.
            // Helper functions inside component are recreated every render.
            // Let's move shuffleArray outside or use it as is.
            // It's pure, so it's fine.
            const newArr = [...otherSongs];
            for (let i = newArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
            }
            newQueue = [song, ...newArr];
        } else {
            newQueue = songsList;
        }

        setQueue(newQueue);

        // Update index
        const newIndex = newQueue.findIndex(s => s.id === song.id);
        setQueueIndex(newIndex);

        _playInternal(song);
    }, [getFilteredSongs, isShuffled, _playInternal, togglePlay, currentSongRef]);

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

    const addVault = async (name, coverImage) => {
        // Simple color cycle or random
        const colors = [
            { color: 'from-purple-600 to-indigo-600', text: 'text-purple-400', border: 'border-purple-500/30', bg_hex: '#2e1065' },
            { color: 'from-blue-500 to-cyan-500', text: 'text-blue-400', border: 'border-blue-500/30', bg_hex: '#1e3a8a' },
            { color: 'from-red-600 to-orange-600', text: 'text-red-400', border: 'border-red-500/30', bg_hex: '#7f1d1d' },
            { color: 'from-emerald-600 to-teal-600', text: 'text-emerald-400', border: 'border-emerald-500/30', bg_hex: '#047857' },
        ];
        const randomStyle = colors[Math.floor(Math.random() * colors.length)];

        // Optimistic Update
        const optimisticVault = {
            id: `temp-${Date.now()}`,
            name: name,
            color: randomStyle.color,
            created_at: new Date().toISOString()
        };
        setGroups(prev => [...prev, optimisticVault]);

        const { data, error } = await supabase.from('vaults').insert([{
            name: name,
            color: randomStyle.color,
        }]).select();

        if (error) {
            console.error('Error creating vault:', error);
            // Rollback
            setGroups(prev => prev.filter(g => g.id !== optimisticVault.id));
        } else if (data) {
            // Replace temp ID with real one (Realtime might handle this, but let's be safe)
            // Actually, Realtime will send an INSERT event.
            // If we keep the optimistic one, we might get duplicates until we refresh.
            // Better strategy: Don't optimistic update if we rely on Realtime, OR ignore Realtime for self-generated actions.
            // Simple approach: The Realtime subscription adds it. 
            // If user says "automatic", maybe they mean "it didn't show up".
            // Let's rely on the returned data to update the local state immediately if Realtime is slow.

            // Remove optimistic, add real (deduplication logic needed in Realtime handler?)
            const realVault = data[0];
            setGroups(prev => prev.map(g => g.id === optimisticVault.id ? realVault : g));
        }
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
