import { SongService } from './SongService';

/**
 * Mock implementation of SongService for testing
 */
export class MockSongService extends SongService {
  constructor() {
    super();
    this.mockSongs = [];
    this.mockVaultSongs = [];
    this.mockErrors = {};
  }

  /**
   * Set mock song data for testing
   * @param {Song[]} songs
   */
  setMockData(songs) {
    this.mockSongs = songs;
  }

  /**
   * Set mock vault-song links for testing
   * @param {Array<{song_id: string, vault_id: string}>} vaultSongs
   */
  setMockVaultSongs(vaultSongs) {
    this.mockVaultSongs = vaultSongs;
  }

  /**
   * Set mock error for testing
   * @param {string} method
   * @param {Error} error
   */
  setError(method, error) {
    this.mockErrors[method] = error;
  }

  /**
   * Clear mock error
   * @param {string} method
   */
  clearError(method) {
    delete this.mockErrors[method];
  }

  async getSongsForVaults(vaultIds) {
    if (this.mockErrors.getSongsForVaults) {
      return { data: [], error: this.mockErrors.getSongsForVaults };
    }
    if (!vaultIds || vaultIds.length === 0) {
      return { data: [], error: null };
    }
    const songIds = this.mockVaultSongs
      .filter(vs => vaultIds.includes(vs.vault_id))
      .map(vs => vs.song_id);
    const songs = this.mockSongs.filter(s => songIds.includes(s.id));
    return { data: songs, error: null };
  }

  async getSongById(songId) {
    if (this.mockErrors.getSongById) {
      return { data: null, error: this.mockErrors.getSongById };
    }
    const song = this.mockSongs.find(s => s.id === songId);
    return { data: song || null, error: song ? null : new Error('Song not found') };
  }

  async createSong(songData) {
    if (this.mockErrors.createSong) {
      return { data: null, error: this.mockErrors.createSong };
    }
    const newSong = {
      id: `song-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...songData
    };
    this.mockSongs.push(newSong);
    return { data: newSong, error: null };
  }

  async updateSong(songId, updates) {
    if (this.mockErrors.updateSong) {
      return { data: null, error: this.mockErrors.updateSong };
    }
    const index = this.mockSongs.findIndex(s => s.id === songId);
    if (index === -1) {
      return { data: null, error: new Error('Song not found') };
    }
    this.mockSongs[index] = { ...this.mockSongs[index], ...updates };
    return { data: this.mockSongs[index], error: null };
  }

  async deleteSong(songId) {
    if (this.mockErrors.deleteSong) {
      return { error: this.mockErrors.deleteSong };
    }
    this.mockSongs = this.mockSongs.filter(s => s.id !== songId);
    this.mockVaultSongs = this.mockVaultSongs.filter(vs => vs.song_id !== songId);
    return { error: null };
  }

  async linkSongToVault(songId, vaultId, addedBy) {
    if (this.mockErrors.linkSongToVault) {
      return { error: this.mockErrors.linkSongToVault };
    }
    this.mockVaultSongs.push({
      song_id: songId,
      vault_id: vaultId,
      added_by: addedBy,
      added_at: new Date().toISOString()
    });
    return { error: null };
  }
}
