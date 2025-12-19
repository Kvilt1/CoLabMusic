import { VaultMemberService } from './VaultMemberService';

/**
 * Mock implementation of VaultMemberService for testing
 */
export class MockVaultMemberService extends VaultMemberService {
  constructor() {
    super();
    this.mockMembers = [];
    this.mockErrors = {};
  }

  /**
   * Set mock member data for testing
   * @param {VaultMember[]} members
   */
  setMockData(members) {
    this.mockMembers = members;
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

  async getVaultMembers(vaultId) {
    if (this.mockErrors.getVaultMembers) {
      return { data: [], error: this.mockErrors.getVaultMembers };
    }
    const members = this.mockMembers.filter(m => m.vault_id === vaultId);
    return { data: members, error: null };
  }

  async addMember(vaultId, userId, role) {
    if (this.mockErrors.addMember) {
      return { error: this.mockErrors.addMember };
    }
    const newMember = {
      id: `member-${Date.now()}`,
      vault_id: vaultId,
      user_id: userId,
      role,
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    this.mockMembers.push(newMember);
    return { error: null };
  }

  async updateMemberRole(memberId, role) {
    if (this.mockErrors.updateMemberRole) {
      return { error: this.mockErrors.updateMemberRole };
    }
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return { error: new Error('Invalid role') };
    }
    const index = this.mockMembers.findIndex(m => m.id === memberId);
    if (index === -1) {
      return { error: new Error('Member not found') };
    }
    this.mockMembers[index].role = role;
    return { error: null };
  }

  async removeMember(memberId) {
    if (this.mockErrors.removeMember) {
      return { error: this.mockErrors.removeMember };
    }
    this.mockMembers = this.mockMembers.filter(m => m.id !== memberId);
    return { error: null };
  }
}
