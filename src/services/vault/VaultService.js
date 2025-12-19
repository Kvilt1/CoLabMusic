/**
 * Abstract VaultService interface
 * All vault implementations should extend this class
 */
export class VaultService {
  /**
   * Get vaults owned by a user
   * @param {string} userId
   * @returns {Promise<{data: Vault[], error: Error|null}>}
   */
  async getUserVaults(userId) {
    throw new Error('getUserVaults() must be implemented');
  }

  /**
   * Get vaults accessible to a user (owned + member)
   * @param {string} userId
   * @returns {Promise<{data: Vault[], error: Error|null}>}
   */
  async getAccessibleVaults(userId) {
    throw new Error('getAccessibleVaults() must be implemented');
  }

  /**
   * Create a new vault
   * @param {Object} vaultData
   * @returns {Promise<{data: Vault, error: Error|null}>}
   */
  async createVault(vaultData) {
    throw new Error('createVault() must be implemented');
  }

  /**
   * Update a vault
   * @param {string} vaultId
   * @param {Object} updates
   * @returns {Promise<{data: Vault, error: Error|null}>}
   */
  async updateVault(vaultId, updates) {
    throw new Error('updateVault() must be implemented');
  }

  /**
   * Delete a vault
   * @param {string} vaultId
   * @returns {Promise<{error: Error|null}>}
   */
  async deleteVault(vaultId) {
    throw new Error('deleteVault() must be implemented');
  }

  /**
   * Regenerate invite code for a vault
   * @param {string} vaultId
   * @returns {Promise<{data: string, error: Error|null}>}
   */
  async regenerateInviteCode(vaultId) {
    throw new Error('regenerateInviteCode() must be implemented');
  }

  /**
   * Join a vault using an invite code
   * @param {string} code
   * @param {string} userId
   * @returns {Promise<{data: Vault, error: Error|null}>}
   */
  async joinVaultByCode(code, userId) {
    throw new Error('joinVaultByCode() must be implemented');
  }

  /**
   * Transfer vault ownership
   * @param {string} vaultId
   * @param {string} newOwnerUserId
   * @returns {Promise<{error: Error|null}>}
   */
  async transferOwnership(vaultId, newOwnerUserId) {
    throw new Error('transferOwnership() must be implemented');
  }

  /**
   * Leave a vault
   * @param {string} vaultId
   * @param {string} userId
   * @param {VaultMember[]} members
   * @returns {Promise<{error: Error|null}>}
   */
  async leaveVault(vaultId, userId, members) {
    throw new Error('leaveVault() must be implemented');
  }
}
