/**
 * Abstract SongService interface
 * All song implementations should extend this class
 */
export class SongService {
  /**
   * Get songs for multiple vaults
   * @param {string[]} vaultIds
   * @returns {Promise<{data: Song[], error: Error|null}>}
   */
  async getSongsForVaults(vaultIds) {
    throw new Error('getSongsForVaults() must be implemented');
  }

  /**
   * Get a song by ID
   * @param {string} songId
   * @returns {Promise<{data: Song, error: Error|null}>}
   */
  async getSongById(songId) {
    throw new Error('getSongById() must be implemented');
  }

  /**
   * Create a new song
   * @param {Object} songData
   * @returns {Promise<{data: Song, error: Error|null}>}
   */
  async createSong(songData) {
    throw new Error('createSong() must be implemented');
  }

  /**
   * Update a song
   * @param {string} songId
   * @param {Object} updates
   * @returns {Promise<{data: Song, error: Error|null}>}
   */
  async updateSong(songId, updates) {
    throw new Error('updateSong() must be implemented');
  }

  /**
   * Delete a song
   * @param {string} songId
   * @returns {Promise<{error: Error|null}>}
   */
  async deleteSong(songId) {
    throw new Error('deleteSong() must be implemented');
  }

  /**
   * Link a song to a vault
   * @param {string} songId
   * @param {string} vaultId
   * @param {string} addedBy
   * @returns {Promise<{error: Error|null}>}
   */
  async linkSongToVault(songId, vaultId, addedBy) {
    throw new Error('linkSongToVault() must be implemented');
  }
}
