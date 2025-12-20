/**
 * Vault Context - Manages vaults and songs state with realtime updates
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useServices } from '../services';
import { useVaultOperations } from '../hooks/useVaultOperations';
import { useSongOperations } from '../hooks/useSongOperations';
import { useRealtime } from '../hooks/useRealtime';

const VaultContext = createContext();

export const useVaults = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVaults must be used within VaultProvider');
  }
  return context;
};

export const VaultProvider = ({ children, currentUser }) => {
  const services = useServices();
  const { auth } = services;

  const [vaults, setVaults] = useState([]);
  const [allSongs, setAllSongs] = useState([]);

  // Initialize operation hooks
  const vaultOps = useVaultOperations(services, currentUser);
  const songOps = useSongOperations(services);

  /**
   * Fetch vaults and songs
   */
  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setVaults([]);
      setAllSongs([]);
      return;
    }

    // Fetch vaults
    const { data: vaultsData } = await vaultOps.getAccessibleVaults();
    if (vaultsData) {
      setVaults(vaultsData);

      // Fetch songs for all accessible vaults
      const vaultIds = vaultsData.map(v => v.id);
      const { data: songsData } = await songOps.getSongsForVaults(vaultIds);
      if (songsData) {
        setAllSongs(songsData);
      }
    }
  }, [currentUser, vaultOps, songOps]);

  /**
   * Initial data fetch and auth state listener
   */
  useEffect(() => {
    fetchData();

    const { data: { subscription } } = auth.onAuthStateChange(() => {
      fetchData();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [auth, fetchData]);

  /**
   * Realtime subscription callbacks
   */
  const realtimeCallbacks = {
    onVaultInsert: (newVault) => {
      setVaults(prev => {
        if (prev.some(v => v.id === newVault.id)) return prev;
        return [...prev, newVault];
      });
    },
    onVaultUpdate: (updatedVault) => {
      setVaults(prev => prev.map(v =>
        v.id === updatedVault.id ? { ...v, ...updatedVault } : v
      ));
    },
    onVaultDelete: (deletedVault) => {
      setVaults(prev => prev.filter(v => v.id !== deletedVault.id));
    },
    onSongUpdate: (updatedSong) => {
      setAllSongs(prev => prev.map(s =>
        s.id === updatedSong.id ? { ...s, ...updatedSong } : s
      ));
    },
    onSongDelete: (deletedSong) => {
      setAllSongs(prev => prev.filter(s => s.id !== deletedSong.id));
    },
    onVaultSongInsert: (newSong) => {
      setAllSongs(prev => {
        if (prev.some(s => s.id === newSong.id)) return prev;
        return [newSong, ...prev];
      });
    },
    onVaultSongDelete: (deletedVaultSong) => {
      setAllSongs(prev => prev.filter(s =>
        !(s.id === deletedVaultSong.song_id && s.vault_id === deletedVaultSong.vault_id)
      ));
    }
  };

  /**
   * Set up realtime subscriptions
   */
  const accessibleVaultIds = vaults.map(v => v.id);
  const { subscribeToVaults, subscribeToSongs, subscribeToVaultSongs } = useRealtime(
    services,
    realtimeCallbacks
  );

  useEffect(() => {
    const vaultSub = subscribeToVaults();
    const songSub = subscribeToSongs();
    const vaultSongSub = subscribeToVaultSongs(accessibleVaultIds);

    return () => {
      vaultSub.unsubscribe();
      songSub.unsubscribe();
      vaultSongSub.unsubscribe();
    };
  }, [subscribeToVaults, subscribeToSongs, subscribeToVaultSongs, accessibleVaultIds.join(',')]);

  /**
   * Vault operations with optimistic updates
   */
  const createVault = useCallback(async (name, coverImage) => {
    // Optimistic update
    const optimisticVault = {
      id: `temp-${Date.now()}`,
      name: name,
      created_at: new Date().toISOString(),
      owner_id: currentUser?.id
    };
    setVaults(prev => [...prev, optimisticVault]);

    const result = await vaultOps.createVault(name, coverImage);

    if (result.error) {
      // Rollback on error
      setVaults(prev => prev.filter(v => v.id !== optimisticVault.id));
      return result;
    }

    // Replace optimistic with real vault
    if (result.data) {
      setVaults(prev => prev.map(v =>
        v.id === optimisticVault.id ? result.data : v
      ));
    }

    return result;
  }, [vaultOps, currentUser]);

  const updateVault = useCallback(async (vaultId, updates) => {
    // Optimistic update
    const previousVaults = vaults;
    setVaults(prev => prev.map(v =>
      v.id === vaultId ? { ...v, ...updates } : v
    ));

    const result = await vaultOps.updateVault(vaultId, updates);

    if (result.error) {
      // Rollback on error
      setVaults(previousVaults);
      return result;
    }

    // Update with new invite code if regenerated
    if (updates.invite_code) {
      setVaults(prev => prev.map(v =>
        v.id === vaultId ? { ...v, invite_code: updates.invite_code } : v
      ));
    }

    return result;
  }, [vaultOps, vaults]);

  const deleteVault = useCallback(async (vaultId) => {
    // Optimistic update
    const previousVaults = vaults;
    const previousSongs = allSongs;
    setVaults(prev => prev.filter(v => v.id !== vaultId));
    setAllSongs(prev => prev.filter(s => s.vault_id !== vaultId));

    const result = await vaultOps.deleteVault(vaultId);

    if (result.error) {
      // Rollback on error
      setVaults(previousVaults);
      setAllSongs(previousSongs);
    }

    return result;
  }, [vaultOps, vaults, allSongs]);

  const joinVaultByCode = useCallback(async (code) => {
    const result = await vaultOps.joinVaultByCode(code);

    if (result.data) {
      // Add to local vaults
      setVaults(prev => {
        if (prev.some(v => v.id === result.data.id)) return prev;
        return [...prev, result.data];
      });
    }

    return result;
  }, [vaultOps]);

  const leaveVault = useCallback(async (vaultId, members) => {
    const result = await vaultOps.leaveVault(vaultId, members);

    if (!result.error) {
      // Remove from local state
      setVaults(prev => prev.filter(v => v.id !== vaultId));
    }

    return result;
  }, [vaultOps]);

  const regenerateInviteCode = useCallback(async (vaultId) => {
    const result = await vaultOps.regenerateInviteCode(vaultId);

    if (result.data) {
      // Update local state with new code
      setVaults(prev => prev.map(v =>
        v.id === vaultId ? { ...v, invite_code: result.data } : v
      ));
    }

    return result;
  }, [vaultOps]);

  /**
   * Song operations with optimistic updates
   */
  const updateSong = useCallback(async (songId, updates) => {
    // Optimistic update
    const previousSongs = allSongs;
    setAllSongs(prev => prev.map(s =>
      s.id === songId ? { ...s, ...updates } : s
    ));

    const result = await songOps.updateSong(songId, updates);

    if (result.error) {
      // Rollback on error
      setAllSongs(previousSongs);
    }

    return result;
  }, [songOps, allSongs]);

  const deleteSong = useCallback(async (songId) => {
    const songToDelete = allSongs.find(s => s.id === songId);

    // Optimistic update
    const previousSongs = allSongs;
    setAllSongs(prev => prev.filter(s => s.id !== songId));

    const result = await songOps.deleteSong(songToDelete);

    if (result.error) {
      // Rollback on error
      setAllSongs(previousSongs);
    }

    return result;
  }, [songOps, allSongs]);

  const addSongToState = useCallback((song) => {
    setAllSongs(prev => {
      if (prev.some(s => s.id === song.id)) return prev;
      return [song, ...prev];
    });
  }, []);

  const value = {
    // State
    vaults,
    allSongs,

    // Vault operations
    createVault,
    updateVault,
    deleteVault,
    joinVaultByCode,
    leaveVault,
    regenerateInviteCode,
    getVaultMembers: vaultOps.getVaultMembers,
    updateMemberRole: vaultOps.updateMemberRole,
    removeMember: vaultOps.removeMember,
    transferOwnership: vaultOps.transferOwnership,
    uploadVaultCover: vaultOps.uploadVaultCover,

    // Song operations
    updateSong,
    deleteSong,
    addSongToState,
    getSongById: songOps.getSongById,
    getFilteredSongs: songOps.getFilteredSongs,

    // Utility
    refreshData: fetchData
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
};
