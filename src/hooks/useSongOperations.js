/**
 * Custom hook for song CRUD operations
 */

import { useCallback } from 'react';
import { handleError, SongError } from '../utils/errors';
import { validateSongMetadata, assertValid } from '../utils/validation';

export function useSongOperations(services) {
  const { song, storage } = services;

  /**
   * Get songs for specific vaults
   */
  const getSongsForVaults = useCallback(async (vaultIds) => {
    try {
      if (!vaultIds || vaultIds.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await song.getSongsForVaults(vaultIds);

      if (error) {
        throw new SongError(error.message || 'Failed to fetch songs', error);
      }

      // Filter only ready songs and sort by creation date
      const readySongs = (data || [])
        .filter(s => s.processing_status === 'ready')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { data: readySongs, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [song]);

  /**
   * Get song by ID
   */
  const getSongById = useCallback(async (songId) => {
    try {
      const { data, error } = await song.getSongById(songId);

      if (error) {
        throw new SongError(error.message || 'Failed to fetch song', error);
      }

      return { data, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [song]);

  /**
   * Update song metadata
   */
  const updateSong = useCallback(async (songId, updates) => {
    try {
      // Validate metadata if title or artist is being updated
      if (updates.title || updates.artist) {
        const metadata = {
          title: updates.title,
          artist: updates.artist,
          album: updates.album,
          duration: updates.duration,
          year: updates.year
        };

        const validation = validateSongMetadata(metadata);

        // Only validate if we have the required fields
        if (updates.title && updates.artist) {
          assertValid(validation, 'Song metadata validation');
          Object.assign(updates, validation.value);
        }
      }

      const { error } = await song.updateSong(songId, updates);

      if (error) {
        throw new SongError(error.message || 'Failed to update song', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [song]);

  /**
   * Delete song
   */
  const deleteSong = useCallback(async (songToDelete) => {
    try {
      if (!songToDelete) {
        throw new SongError('Song not found');
      }

      // Delete from database
      const { error: dbError } = await song.deleteSong(songToDelete.id);

      if (dbError) {
        throw new SongError(dbError.message || 'Failed to delete song', dbError);
      }

      // Try to delete from storage
      const fileUrl = songToDelete.file_url || songToDelete.url;
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
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [song, storage]);

  /**
   * Search songs by query
   */
  const searchSongs = useCallback((songs, query) => {
    if (!query || query.trim().length === 0) {
      return songs;
    }

    const normalizedQuery = query.toLowerCase().trim();

    return songs.filter(song =>
      song.title?.toLowerCase().includes(normalizedQuery) ||
      song.artist?.toLowerCase().includes(normalizedQuery) ||
      song.album?.toLowerCase().includes(normalizedQuery)
    );
  }, []);

  /**
   * Filter songs by vault
   */
  const filterSongsByVault = useCallback((songs, vaultId) => {
    if (!vaultId || vaultId === 'all') {
      return songs;
    }

    return songs.filter(song => song.vault_id === vaultId);
  }, []);

  /**
   * Get filtered and searched songs
   */
  const getFilteredSongs = useCallback((allSongs, vaultId, searchQuery) => {
    let filtered = filterSongsByVault(allSongs, vaultId);

    if (searchQuery) {
      filtered = searchSongs(filtered, searchQuery);
    }

    return filtered;
  }, [filterSongsByVault, searchSongs]);

  return {
    getSongsForVaults,
    getSongById,
    updateSong,
    deleteSong,
    searchSongs,
    filterSongsByVault,
    getFilteredSongs
  };
}
