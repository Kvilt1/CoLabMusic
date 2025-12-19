/**
 * Abstract AuthService interface
 * All auth implementations should extend this class
 */
export class AuthService {
  /**
   * Get the current authenticated user
   * @returns {Promise<{data: User|null, error: Error|null}>}
   */
  async getUser() {
    throw new Error('getUser() must be implemented');
  }

  /**
   * Get the current session
   * @returns {Promise<{data: Session|null, error: Error|null}>}
   */
  async getSession() {
    throw new Error('getSession() must be implemented');
  }

  /**
   * Sign out the current user
   * @returns {Promise<{error: Error|null}>}
   */
  async signOut() {
    throw new Error('signOut() must be implemented');
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Callback function (event, session) => void
   * @returns {{data: {subscription: {unsubscribe: Function}}}}
   */
  onAuthStateChange(callback) {
    throw new Error('onAuthStateChange() must be implemented');
  }
}
