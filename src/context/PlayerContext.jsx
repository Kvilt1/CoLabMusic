
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
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                // Fetch vaults where user is a member OR owner
                const { data: memberVaults } = await supabase
                    .from('vault_members')
                    .select('vault_id')
                    .eq('user_id', user.id);
                
                const memberVaultIds = memberVaults?.map(m => m.vault_id) || [];
                
                // Get all vaults where user is member or owner
                const { data: vaultsData } = await supabase
                    .from('vaults')
                    .select('*')
                    .or(`owner_id.eq.${user.id},id.in.(${memberVaultIds.length > 0 ? memberVaultIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
                    .order('created_at', { ascending: true });
                
                if (vaultsData) setGroups(vaultsData);

                // Only fetch songs from vaults the user has access to
                const accessibleVaultIds = vaultsData?.map(v => v.id) || [];
                if (accessibleVaultIds.length > 0) {
                    const { data: songsData } = await supabase
                        .from('songs')
                        .select('*')
                        .in('group_id', accessibleVaultIds)
                        .order('created_at', { ascending: false });
                    if (songsData) setAllSongs(songsData);
                } else {
                    // User has no vaults, show no songs
                    setAllSongs([]);
                }
            } else {
                // Not logged in, show nothing
                setGroups([]);
                setAllSongs([]);
            }
        };

        fetchData();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user || null);
            fetchData(); // Refetch data when auth changes
        });

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
                    } else if (payload.eventType === 'UPDATE') {
                        setGroups(prev => prev.map(g => 
                            g.id === payload.new.id ? { ...g, ...payload.new } : g
                        ));
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
                        // Only add song if it belongs to a vault the user has access to
                        setGroups(currentGroups => {
                            const accessibleVaultIds = currentGroups.map(g => g.id);
                            if (accessibleVaultIds.includes(payload.new.group_id)) {
                                setAllSongs(prev => [payload.new, ...prev]);
                            }
                            return currentGroups; // Don't modify groups
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setAllSongs(prev => prev.filter(s => s.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setAllSongs(prev => prev.map(s => 
                            s.id === payload.new.id ? { ...s, ...payload.new } : s
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            subscription?.unsubscribe();
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
        let filtered = currentView === 'all'
            ? allSongs
            : allSongs.filter(s => s.group_id === currentView);
        
        // Apply list search filter if query exists
        if (listSearchQuery.trim()) {
            const query = listSearchQuery.toLowerCase();
            filtered = filtered.filter(song => 
                song.title?.toLowerCase().includes(query) ||
                song.artist?.toLowerCase().includes(query) ||
                song.album?.toLowerCase().includes(query)
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
            created_at: new Date().toISOString(),
            owner_id: currentUser.id
        };
        setGroups(prev => [...prev, optimisticVault]);

        // Create vault with owner_id
        const { data, error } = await supabase.from('vaults').insert([{
            name: name,
            color: randomStyle.color,
            owner_id: currentUser.id
        }]).select();

        if (error) {
            console.error('Error creating vault:', error);
            setGroups(prev => prev.filter(g => g.id !== optimisticVault.id));
            return { error };
        }
        
        if (data && data[0]) {
            const realVault = data[0];
            setGroups(prev => prev.map(g => g.id === optimisticVault.id ? realVault : g));

            // Add creator as owner in vault_members
            const { error: memberError } = await supabase.from('vault_members').insert([{
                vault_id: realVault.id,
                user_id: currentUser.id,
                role: 'owner',
                status: 'active',
                display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
                email: currentUser.email
            }]);

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

        const { error } = await supabase
            .from('vaults')
            .update(updates)
            .eq('id', vaultId);

        if (error) {
            console.error('Error updating vault:', error);
            // Refetch to rollback
            const { data: vaultsData } = await supabase.from('vaults').select('*').order('created_at', { ascending: true });
            if (vaultsData) setGroups(vaultsData);
            return { error };
        }
        return { error: null };
    };

    // Delete Vault
    const deleteVault = async (vaultId) => {
        // Optimistic removal
        const previousGroups = groups;
        setGroups(prev => prev.filter(g => g.id !== vaultId));

        // Transfer songs to "no vault" (set group_id to null)
        await supabase
            .from('songs')
            .update({ group_id: null })
            .eq('group_id', vaultId);

        const { error } = await supabase
            .from('vaults')
            .delete()
            .eq('id', vaultId);

        if (error) {
            console.error('Error deleting vault:', error);
            setGroups(previousGroups);
            return { error };
        }
        return { error: null };
    };

    // Get Vault Members with user info
    const getVaultMembers = async (vaultId) => {
        const { data, error } = await supabase
            .from('vault_members')
            .select('*')
            .eq('vault_id', vaultId)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error fetching members:', error);
            return [];
        }
        return data || [];
    };

    // Regenerate Invite Code
    const regenerateInviteCode = async (vaultId) => {
        // Generate a new 6-character code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let newCode = '';
        for (let i = 0; i < 6; i++) {
            newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const { data, error } = await supabase
            .from('vaults')
            .update({ invite_code: newCode })
            .eq('id', vaultId)
            .select();

        if (error) {
            console.error('Error regenerating invite code:', error);
            return { code: null, error };
        }

        // Update local state
        if (data && data[0]) {
            setGroups(prev => prev.map(g => 
                g.id === vaultId ? { ...g, invite_code: data[0].invite_code } : g
            ));
        }

        return { code: data?.[0]?.invite_code, error: null };
    };

    // Join Vault by Invite Code
    const joinVaultByCode = async (code) => {
        if (!currentUser) {
            return { vault: null, error: { message: 'You must be logged in to join a vault.' } };
        }

        const normalizedCode = code.toUpperCase().trim();
        
        // Find vault with this invite code
        const { data: vault, error: findError } = await supabase
            .from('vaults')
            .select('*')
            .eq('invite_code', normalizedCode)
            .single();

        if (findError || !vault) {
            return { vault: null, error: { message: 'Invalid invite code. Please check and try again.' } };
        }

        // Check if already a member
        const { data: existingMember } = await supabase
            .from('vault_members')
            .select('id')
            .eq('vault_id', vault.id)
            .eq('user_id', currentUser.id)
            .single();

        if (existingMember) {
            return { vault, error: { message: 'You already have access to this vault.' } };
        }

        // Also check if user is the owner
        if (vault.owner_id === currentUser.id) {
            return { vault, error: { message: 'You already have access to this vault.' } };
        }

        // Add user to vault_members
        const { error: joinError } = await supabase.from('vault_members').insert([{
            vault_id: vault.id,
            user_id: currentUser.id,
            role: 'member',
            status: 'active',
            display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email
        }]);

        if (joinError) {
            console.error('Error joining vault:', joinError);
            return { vault: null, error: { message: 'Failed to join vault. Please try again.' } };
        }

        // Add to local groups
        setGroups(prev => {
            if (prev.some(g => g.id === vault.id)) return prev;
            return [...prev, vault];
        });

        return { vault, error: null };
    };

    // Update Member Role
    const updateMemberRole = async (memberId, role) => {
        const { error } = await supabase
            .from('vault_members')
            .update({ role })
            .eq('id', memberId);
        
        if (error) {
            console.error('Error updating member role:', error);
            return { error };
        }
        return { error: null };
    };

    // Remove Member
    const removeMember = async (memberId) => {
        const { error } = await supabase
            .from('vault_members')
            .delete()
            .eq('id', memberId);
        
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

        // Update old owner's role to 'admin'
        const { error: oldOwnerError } = await supabase
            .from('vault_members')
            .update({ role: 'admin' })
            .eq('vault_id', vaultId)
            .eq('user_id', currentUser.id);

        if (oldOwnerError) {
            console.error('Error updating old owner role:', oldOwnerError);
            return { error: oldOwnerError };
        }

        // Update the new owner's role to 'owner'
        const { error: roleError } = await supabase
            .from('vault_members')
            .update({ role: 'owner' })
            .eq('vault_id', vaultId)
            .eq('user_id', newOwnerUserId);

        if (roleError) {
            console.error('Error transferring ownership:', roleError);
            // Rollback old owner
            await supabase.from('vault_members').update({ role: 'owner' }).eq('vault_id', vaultId).eq('user_id', currentUser.id);
            return { error: roleError };
        }

        // Update vault's owner_id
        const { error: vaultError } = await supabase
            .from('vaults')
            .update({ owner_id: newOwnerUserId })
            .eq('id', vaultId);

        if (vaultError) {
            console.error('Error updating vault owner:', vaultError);
            return { error: vaultError };
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

        // Find current user's membership
        const currentMember = members.find(m => m.user_id === currentUser.id);
        const vault = groups.find(g => g.id === vaultId);
        const isOwner = currentMember?.role === 'owner' || vault?.owner_id === currentUser.id;

        if (isOwner) {
            // Get other members (excluding current user)
            const otherMembers = members.filter(m => m.user_id !== currentUser.id);

            if (otherMembers.length === 0) {
                // No other members - delete the vault instead
                return { error: { message: 'You are the only member. Delete the vault instead of leaving.' } };
            }

            // Role priority: admin > member > viewer
            const rolePriority = { admin: 1, member: 2, viewer: 3 };

            // Sort members by:
            // 1. Role priority (highest permission first)
            // 2. Join date (earliest first - been in vault longest)
            const sortedMembers = [...otherMembers].sort((a, b) => {
                const priorityA = rolePriority[a.role] || 99;
                const priorityB = rolePriority[b.role] || 99;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                // Same role - sort by join date (earliest first)
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return dateA - dateB;
            });

            const newOwner = sortedMembers[0];

            // Update the new owner's role to 'owner' and vault's owner_id
            const { error: newOwnerError } = await supabase
                .from('vault_members')
                .update({ role: 'owner' })
                .eq('vault_id', vaultId)
                .eq('user_id', newOwner.user_id);

            if (newOwnerError) {
                console.error('Error setting new owner:', newOwnerError);
                return { error: newOwnerError };
            }

            const { error: vaultError } = await supabase
                .from('vaults')
                .update({ owner_id: newOwner.user_id })
                .eq('id', vaultId);

            if (vaultError) {
                console.error('Error updating vault owner:', vaultError);
                return { error: vaultError };
            }
        }

        // Remove current user from vault_members
        const { error: leaveError } = await supabase
            .from('vault_members')
            .delete()
            .eq('vault_id', vaultId)
            .eq('user_id', currentUser.id);

        if (leaveError) {
            console.error('Error leaving vault:', leaveError);
            return { error: leaveError };
        }

        // Remove from local state
        setGroups(prev => prev.filter(g => g.id !== vaultId));
        
        // Navigate back to home
        switchView('all');

        return { error: null, transferred: isOwner };
    };

    // Logout function
    const logout = async () => {
        await supabase.auth.signOut();
        // State will be cleared by the onAuthStateChange listener
    };

    // Upload vault cover image
    const uploadVaultCover = async (vaultId, file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vaultId}-${Date.now()}.${fileExt}`;
        const filePath = `vault-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('music')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading cover:', uploadError);
            return { url: null, error: uploadError };
        }

        const { data: urlData } = supabase.storage
            .from('music')
            .getPublicUrl(filePath);

        return { url: urlData.publicUrl, error: null };
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
