/**
 * Abstract VaultMemberService interface
 * All vault member implementations should extend this class
 */
export class VaultMemberService {
  /**
   * Get all members of a vault
   * @param {string} vaultId
   * @returns {Promise<{data: VaultMember[], error: Error|null}>}
   */
  async getVaultMembers(vaultId) {
    throw new Error('getVaultMembers() must be implemented');
  }

  /**
   * Add a member to a vault
   * @param {string} vaultId
   * @param {string} userId
   * @param {'owner'|'admin'|'member'|'viewer'} role
   * @returns {Promise<{error: Error|null}>}
   */
  async addMember(vaultId, userId, role) {
    throw new Error('addMember() must be implemented');
  }

  /**
   * Update a member's role
   * @param {string} memberId
   * @param {'owner'|'admin'|'member'|'viewer'} role
   * @returns {Promise<{error: Error|null}>}
   */
  async updateMemberRole(memberId, role) {
    throw new Error('updateMemberRole() must be implemented');
  }

  /**
   * Remove a member from a vault
   * @param {string} memberId
   * @returns {Promise<{error: Error|null}>}
   */
  async removeMember(memberId) {
    throw new Error('removeMember() must be implemented');
  }
}
