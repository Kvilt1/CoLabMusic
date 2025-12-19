
import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { useServices } from '../services';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    // Get services from context
    const { auth, vault, vaultMember, song, storage, realtime } = useServices();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [currentView, setCurrentView] = useState('all');
    const [viewData, setViewData] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Auth State
    const [currentUser, setCurrentUser] = useState(null);

    // Vaults State
    const [groups, setGroups] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    
    // List Search State
    const [listSearchQuery, setListSearchQuery] = useState('');

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
            // Get current user
            const { data: user } = await auth.getUser();
            setCurrentUser(user);

            if (user) {
                // Fetch accessible vaults (owned + member)
                const { data: vaultsData } = await vault.getAccessibleVaults(user.id);
                if (vaultsData) setGroups(vaultsData);

                // Fetch songs for accessible vaults
                const accessibleVaultIds = vaultsData?.map(v => v.id) || [];
                const { data: songsData } = await song.getSongsForVaults(accessibleVaultIds);

                // Filter only ready songs and sort
                const readySongs = (songsData || [])
                    .filter(s => s.processing_status === 'ready')
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setAllSongs(readySongs);
            } else {
                // Not logged in, show nothing
                setGroups([]);
                setAllSongs([]);
            }
        };

        fetchData();

        // Listen for auth state changes
        const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user || null);
            fetchData(); // Refetch data when auth changes
        });

        // Realtime Subscriptions using service
        const vaultSub = realtime.subscribeToVaults((payload) => {
            if (payload.eventType === 'INSERT') {
                setGroups(prev => {
                    if (prev.some(g => g.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            } else if (payload.eventType === 'UPDATE') {
                setGroups(prev => prev.map(g =>
                    g.id === payload.new.id ? { ...g, ...payload.new } : g
                ));
            } else if (payload.eventType === 'DELETE') {
                setGroups(prev => prev.filter(g => g.id !== payload.old.id));
            }
        });

        const songSub = realtime.subscribeToSongs((payload) => {
            if (payload.eventType === 'UPDATE') {
                setAllSongs(prev => prev.map(s =>
                    s.id === payload.new.id ? { ...s, ...payload.new } : s
                ));
            } else if (payload.eventType === 'DELETE') {
                setAllSongs(prev => prev.filter(s => s.id !== payload.old.id));
            }
        });

        const vaultSongSub = realtime.subscribeToVaultSongs(async (payload) => {
            if (payload.eventType === 'INSERT') {
                const { data: songData } = await song.getSongById(payload.new.song_id);
                if (songData && songData.processing_status === 'ready') {
                    setGroups(currentGroups => {
                        const accessibleVaultIds = currentGroups.map(g => g.id);
                        if (accessibleVaultIds.includes(payload.new.vault_id)) {
                            setAllSongs(prev => {
                                if (prev.some(s => s.id === songData.id)) return prev;
                                return [songData, ...prev];
                            });
                        }
                        return currentGroups;
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setAllSongs(prev => prev.filter(s =>
                    !(s.id === payload.old.song_id && s.vault_id === payload.old.vault_id)
                ));
            }
        });

        return () => {
            vaultSub.unsubscribe();
            songSub.unsubscribe();
            vaultSongSub.unsubscribe();
            subscription?.unsubscribe();
        };
    }, [auth, vault, song, realtime]);

    // Circular dependency breaker
    const nextSongRef = useRef(null);

    const _playInternal = useCallback((song) => {
        if (soundRef.current) {
            soundRef.current.unload();
        }

        const sound = new Howl({
            src: [song.file_url || song.url], // Support both new and legacy field names
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
                    artwork: [
                        { src: currentSong.cover_url || currentSong.cover || '', sizes: '512x512', type: 'image/png' }
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
        let filtered = currentView === 'all'
            ? allSongs
            : allSongs.filter(s => s.vault_id === currentView);

        // Apply list search filter if query exists
        if (listSearchQuery.trim()) {
            const query = listSearchQuery.toLowerCase();
            filtered = filtered.filter(song =>
                song.title?.toLowerCase().includes(query) ||
                song.artist?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [currentView, allSongs, listSearchQuery]);

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

    const switchView = (viewId, data = null) => {
        setCurrentView(viewId);
        setViewData(data);
        // Clear list search when switching views
        setListSearchQuery('');
    };

    const addVault = async (name, coverImage) => {
        if (!currentUser) {
            console.error('Must be logged in to create a vault');
            return { error: { message: 'Must be logged in to create a vault' } };
        }

        // Optimistic Update
        const optimisticVault = {
            id: `temp-${Date.now()}`,
            name: name,
            created_at: new Date().toISOString(),
            owner_id: currentUser.id
        };
        setGroups(prev => [...prev, optimisticVault]);

        // Create vault with owner_id
        const { data: realVault, error } = await vault.createVault({
            name: name,
            owner_id: currentUser.id
        });

        if (error) {
            console.error('Error creating vault:', error);
            setGroups(prev => prev.filter(g => g.id !== optimisticVault.id));
            return { error };
        }

        if (realVault) {
            setGroups(prev => prev.map(g => g.id === optimisticVault.id ? realVault : g));

            // Add creator as owner in vault_members
            const { error: memberError } = await vaultMember.addMember(
                realVault.id,
                currentUser.id,
                'owner'
            );

            if (memberError) {
                console.error('Error adding owner to vault_members:', memberError);
            }

            return { vault: realVault, error: null };
        }

        return { error: null };
    };

    // Update Vault
    const updateVault = async (vaultId, updates) => {
        // Optimistic update
        setGroups(prev => prev.map(g => g.id === vaultId ? { ...g, ...updates } : g));

        const { error } = await vault.updateVault(vaultId, updates);

        if (error) {
            console.error('Error updating vault:', error);
            // Refetch to rollback
            if (currentUser) {
                const { data: vaultsData } = await vault.getAccessibleVaults(currentUser.id);
                if (vaultsData) setGroups(vaultsData);
            }
            return { error };
        }
        return { error: null };
    };

    // Delete Vault
    const deleteVault = async (vaultId) => {
        // Optimistic removal
        const previousGroups = groups;
        setGroups(prev => prev.filter(g => g.id !== vaultId));

        // Delete vault (cascades to vault_members and vault_songs)
        const { error } = await vault.deleteVault(vaultId);

        if (error) {
            console.error('Error deleting vault:', error);
            setGroups(previousGroups);
            return { error };
        }

        // Remove songs that were only in this vault from UI
        setAllSongs(prev => prev.filter(s => s.vault_id !== vaultId));

        return { error: null };
    };

    // Get Vault Members with user info
    const getVaultMembers = async (vaultId) => {
        const { data, error } = await vaultMember.getVaultMembers(vaultId);

        if (error) {
            console.error('Error fetching members:', error);
            return [];
        }
        return data || [];
    };

    // Regenerate Invite Code
    const regenerateInviteCode = async (vaultId) => {
        const { data: newCode, error } = await vault.regenerateInviteCode(vaultId);

        if (error) {
            console.error('Error regenerating invite code:', error);
            return { code: null, error };
        }

        // Update local state
        if (newCode) {
            setGroups(prev => prev.map(g =>
                g.id === vaultId ? { ...g, invite_code: newCode } : g
            ));
        }

        return { code: newCode, error: null };
    };

    // Join Vault by Invite Code
    const joinVaultByCode = async (code) => {
        if (!currentUser) {
            return { vault: null, error: { message: 'You must be logged in to join a vault.' } };
        }

        const normalizedCode = code.toUpperCase().trim();

        // Join vault using service
        const { data: vaultData, error } = await vault.joinVaultByCode(normalizedCode, currentUser.id);

        if (error) {
            return { vault: null, error: { message: error.message || 'Invalid invite code. Please check and try again.' } };
        }

        // Add to local groups
        if (vaultData) {
            setGroups(prev => {
                if (prev.some(g => g.id === vaultData.id)) return prev;
                return [...prev, vaultData];
            });
        }

        return { vault: vaultData, error: null };
    };

    // Update Member Role
    const updateMemberRole = async (memberId, role) => {
        const { error } = await vaultMember.updateMemberRole(memberId, role);

        if (error) {
            console.error('Error updating member role:', error);
            return { error };
        }
        return { error: null };
    };

    // Remove Member
    const removeMember = async (memberId) => {
        const { error } = await vaultMember.removeMember(memberId);

        if (error) {
            console.error('Error removing member:', error);
            return { error };
        }
        return { error: null };
    };

    // Transfer Vault Ownership
    const transferOwnership = async (vaultId, newOwnerUserId) => {
        if (!currentUser) {
            return { error: { message: 'Must be logged in to transfer ownership' } };
        }

        const { error } = await vault.transferOwnership(vaultId, newOwnerUserId);

        if (error) {
            console.error('Error transferring ownership:', error);
            return { error };
        }

        // Update local state
        setGroups(prev => prev.map(g =>
            g.id === vaultId ? { ...g, owner_id: newOwnerUserId } : g
        ));

        return { error: null };
    };

    // Leave Vault - Handles ownership transfer if owner leaves
    const leaveVault = async (vaultId, members) => {
        if (!currentUser) {
            return { error: { message: 'Must be logged in to leave a vault.' } };
        }

        const { error } = await vault.leaveVault(vaultId, currentUser.id, members);

        if (error) {
            console.error('Error leaving vault:', error);
            return { error };
        }

        // Remove from local state
        setGroups(prev => prev.filter(g => g.id !== vaultId));

        // Navigate back to home
        switchView('all');

        const currentMember = members.find(m => m.user_id === currentUser.id);
        const vaultData = groups.find(g => g.id === vaultId);
        const isOwner = currentMember?.role === 'owner' || vaultData?.owner_id === currentUser.id;

        return { error: null, transferred: isOwner };
    };

    // Add Song to local state (for immediate UI update after upload)
    const addSongToState = (song) => {
        setAllSongs(prev => {
            // Check if song already exists (e.g., from realtime)
            if (prev.some(s => s.id === song.id)) return prev;
            return [song, ...prev];
        });
    };

    // Update Song
    const updateSong = async (songId, updates) => {
        // Optimistic update
        const previousSongs = allSongs;
        setAllSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));

        const { error } = await supabase
            .from('songs')
            .update(updates)
            .eq('id', songId);

        if (error) {
            console.error('Error updating song:', error);
            // Rollback
            setAllSongs(previousSongs);
            return { error };
        }
        return { error: null };
    };

    // Delete Song
    const deleteSong = async (songId) => {
        // Find the song to get its URL for storage deletion
        const song = allSongs.find(s => s.id === songId);
        if (!song) {
            return { error: { message: 'Song not found' } };
        }

        // If this song is currently playing, stop playback
        if (currentSong?.id === songId) {
            if (soundRef.current) {
                soundRef.current.stop();
                soundRef.current.unload();
                soundRef.current = null;
            }
            setCurrentSong(null);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
        }

        // Remove from queue if present
        setQueue(prev => prev.filter(s => s.id !== songId));
        setUserQueue(prev => prev.filter(s => s.id !== songId));
        setOriginalQueue(prev => prev.filter(s => s.id !== songId));

        // Optimistic update - remove from local state
        const previousSongs = allSongs;
        setAllSongs(prev => prev.filter(s => s.id !== songId));

        // Delete from database
        const { error: dbError } = await song.deleteSong(songId);

        if (dbError) {
            console.error('Error deleting song from database:', dbError);
            // Rollback optimistic update
            setAllSongs(previousSongs);
            return { error: dbError };
        }

        // Try to delete from storage (extract path from URL)
        // URL format: https://[project].supabase.co/storage/v1/object/public/music/[path]
        const fileUrl = song.file_url || song.url; // Support both new and legacy field names
        if (fileUrl) {
            try {
                const urlParts = fileUrl.split('/storage/v1/object/public/songs/');
                if (urlParts.length > 1) {
                    const filePath = decodeURIComponent(urlParts[1]);
                    await storage.deleteFile('songs', filePath);
                }
            } catch (storageError) {
                console.warn('Could not delete file from storage:', storageError);
                // Don't fail the operation if storage deletion fails
            }
        }

        return { error: null };
    };

    // Logout function
    const logout = async () => {
        await auth.signOut();
        // State will be cleared by the onAuthStateChange listener
    };

    // Upload vault cover image
    const uploadVaultCover = async (vaultId, file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vaultId}-${Date.now()}.${fileExt}`;
        const filePath = `vault-covers/${fileName}`;

        const { error: uploadError } = await storage.uploadFile('covers', filePath, file);

        if (uploadError) {
            console.error('Error uploading cover:', uploadError);
            return { url: null, error: uploadError };
        }

        const publicUrl = storage.getPublicUrl('covers', filePath);

        return { url: publicUrl, error: null };
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
        viewData,
        groups,
        songs: filteredSongs,
        allSongs, // Export all songs for search functionality
        currentGroup,
        currentTime,
        duration,
        seek,
        nextSong,
        prevSong,

        // Auth
        currentUser,
        logout,

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

        addVault,
        updateVault,
        deleteVault,
        deleteSong,
        updateSong,
        addSongToState,
        
        // Vault Members & Invite Codes
        getVaultMembers,
        regenerateInviteCode,
        joinVaultByCode,
        updateMemberRole,
        removeMember,
        transferOwnership,
        leaveVault,
        uploadVaultCover,
        
        // List Search
        listSearchQuery,
        setListSearchQuery
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};
