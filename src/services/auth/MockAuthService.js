import { AuthService } from './AuthService';

/**
 * Mock implementation of AuthService for testing
 */
export class MockAuthService extends AuthService {
  constructor() {
    super();
    this.mockUser = null;
    this.mockSession = null;
    this.mockError = null;
    this.authChangeListeners = [];
  }

  /**
   * Set mock user data for testing
   * @param {User|null} user
   */
  setMockUser(user) {
    this.mockUser = user;
    this.mockSession = user ? { access_token: 'mock-token', user } : null;
    this.triggerAuthChange('SIGNED_IN', this.mockSession);
  }

  /**
   * Set mock error for testing
   * @param {string} method - Method name to fail
   * @param {Error} error - Error to return
   */
  setError(method, error) {
    this.mockError = { method, error };
  }

  /**
   * Clear mock error
   */
  clearError() {
    this.mockError = null;
  }

  /**
   * Trigger auth state change for testing
   * @param {string} event
   * @param {Session|null} session
   */
  triggerAuthChange(event, session) {
    this.authChangeListeners.forEach(callback => callback(event, session));
  }

  async getUser() {
    if (this.mockError?.method === 'getUser') {
      return { data: null, error: this.mockError.error };
    }
    return { data: this.mockUser, error: null };
  }

  async getSession() {
    if (this.mockError?.method === 'getSession') {
      return { data: null, error: this.mockError.error };
    }
    return { data: this.mockSession, error: null };
  }

  async signOut() {
    if (this.mockError?.method === 'signOut') {
      return { error: this.mockError.error };
    }
    this.mockUser = null;
    this.mockSession = null;
    this.triggerAuthChange('SIGNED_OUT', null);
    return { error: null };
  }

  onAuthStateChange(callback) {
    this.authChangeListeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authChangeListeners.indexOf(callback);
            if (index > -1) {
              this.authChangeListeners.splice(index, 1);
            }
          }
        }
      }
    };
  }
}
