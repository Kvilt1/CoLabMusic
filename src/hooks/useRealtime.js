/**
 * Custom hook for managing realtime subscriptions
 */

import { useEffect, useRef, useCallback } from 'react';

export function useRealtime(services, callbacks = {}) {
  const { realtime, song: songService } = services;
  const {
    onVaultInsert,
    onVaultUpdate,
    onVaultDelete,
    onSongUpdate,
    onSongDelete,
    onVaultSongInsert,
    onVaultSongDelete
  } = callbacks;

  const subscriptionsRef = useRef([]);

  /**
   * Subscribe to vault changes
   */
  const subscribeToVaults = useCallback(() => {
    const subscription = realtime.subscribeToVaults((payload) => {
      if (payload.eventType === 'INSERT' && onVaultInsert) {
        onVaultInsert(payload.new);
      } else if (payload.eventType === 'UPDATE' && onVaultUpdate) {
        onVaultUpdate(payload.new);
      } else if (payload.eventType === 'DELETE' && onVaultDelete) {
        onVaultDelete(payload.old);
      }
    });

    subscriptionsRef.current.push(subscription);
    return subscription;
  }, [realtime, onVaultInsert, onVaultUpdate, onVaultDelete]);

  /**
   * Subscribe to song changes
   */
  const subscribeToSongs = useCallback(() => {
    const subscription = realtime.subscribeToSongs((payload) => {
      if (payload.eventType === 'UPDATE' && onSongUpdate) {
        onSongUpdate(payload.new);
      } else if (payload.eventType === 'DELETE' && onSongDelete) {
        onSongDelete(payload.old);
      }
    });

    subscriptionsRef.current.push(subscription);
    return subscription;
  }, [realtime, onSongUpdate, onSongDelete]);

  /**
   * Subscribe to vault-song relationships
   */
  const subscribeToVaultSongs = useCallback((accessibleVaultIds) => {
    const subscription = realtime.subscribeToVaultSongs(async (payload) => {
      if (payload.eventType === 'INSERT' && onVaultSongInsert) {
        // Check if the vault is accessible
        if (accessibleVaultIds.includes(payload.new.vault_id)) {
          const { data: songData } = await songService.getSongById(payload.new.song_id);
          if (songData && songData.processing_status === 'ready') {
            onVaultSongInsert(songData);
          }
        }
      } else if (payload.eventType === 'DELETE' && onVaultSongDelete) {
        onVaultSongDelete(payload.old);
      }
    });

    subscriptionsRef.current.push(subscription);
    return subscription;
  }, [realtime, songService, onVaultSongInsert, onVaultSongDelete]);

  /**
   * Unsubscribe from all subscriptions
   */
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];
  }, []);

  /**
   * Auto-cleanup on unmount
   */
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribeToVaults,
    subscribeToSongs,
    subscribeToVaultSongs,
    unsubscribeAll
  };
}
