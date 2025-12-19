/**
 * Abstract RealtimeService interface
 * All realtime implementations should extend this class
 */
export class RealtimeService {
  /**
   * Subscribe to vault changes
   * @param {Function} callback - Callback function for changes
   * @returns {{unsubscribe: Function}}
   */
  subscribeToVaults(callback) {
    throw new Error('subscribeToVaults() must be implemented');
  }

  /**
   * Subscribe to song changes
   * @param {Function} callback - Callback function for changes
   * @returns {{unsubscribe: Function}}
   */
  subscribeToSongs(callback) {
    throw new Error('subscribeToSongs() must be implemented');
  }

  /**
   * Subscribe to vault-song link changes
   * @param {Function} callback - Callback function for changes
   * @returns {{unsubscribe: Function}}
   */
  subscribeToVaultSongs(callback) {
    throw new Error('subscribeToVaultSongs() must be implemented');
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    throw new Error('unsubscribeAll() must be implemented');
  }
}
