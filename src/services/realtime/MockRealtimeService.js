import { RealtimeService } from './RealtimeService';

/**
 * Mock implementation of RealtimeService for testing
 */
export class MockRealtimeService extends RealtimeService {
  constructor() {
    super();
    this.vaultCallbacks = [];
    this.songCallbacks = [];
    this.vaultSongCallbacks = [];
  }

  subscribeToVaults(callback) {
    this.vaultCallbacks.push(callback);
    return {
      unsubscribe: () => {
        const index = this.vaultCallbacks.indexOf(callback);
        if (index > -1) {
          this.vaultCallbacks.splice(index, 1);
        }
      }
    };
  }

  subscribeToSongs(callback) {
    this.songCallbacks.push(callback);
    return {
      unsubscribe: () => {
        const index = this.songCallbacks.indexOf(callback);
        if (index > -1) {
          this.songCallbacks.splice(index, 1);
        }
      }
    };
  }

  subscribeToVaultSongs(callback) {
    this.vaultSongCallbacks.push(callback);
    return {
      unsubscribe: () => {
        const index = this.vaultSongCallbacks.indexOf(callback);
        if (index > -1) {
          this.vaultSongCallbacks.splice(index, 1);
        }
      }
    };
  }

  unsubscribeAll() {
    this.vaultCallbacks = [];
    this.songCallbacks = [];
    this.vaultSongCallbacks = [];
  }

  /**
   * Trigger a vault change event for testing
   * @param {Object} payload - Event payload
   */
  triggerVaultChange(payload) {
    this.vaultCallbacks.forEach(callback => callback(payload));
  }

  /**
   * Trigger a song change event for testing
   * @param {Object} payload - Event payload
   */
  triggerSongChange(payload) {
    this.songCallbacks.forEach(callback => callback(payload));
  }

  /**
   * Trigger a vault-song change event for testing
   * @param {Object} payload - Event payload
   */
  triggerVaultSongChange(payload) {
    this.vaultSongCallbacks.forEach(callback => callback(payload));
  }
}
