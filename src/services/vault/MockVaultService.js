import { VaultService } from './VaultService';

/**
 * Mock implementation of VaultService for testing
 */
export class MockVaultService extends VaultService {
  constructor() {
    super();
    this.mockVaults = [];
    this.mockErrors = {};
  }

  /**
   * Set mock vault data for testing
   * @param {Vault[]} vaults
   */
  setMockData(vaults) {
    this.mockVaults = vaults;
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

  async getUserVaults(userId) {
    if (this.mockErrors.getUserVaults) {
      return { data: [], error: this.mockErrors.getUserVaults };
    }
    const vaults = this.mockVaults.filter(v => v.owner_id === userId);
    return { data: vaults, error: null };
  }

  async getAccessibleVaults(userId) {
    if (this.mockErrors.getAccessibleVaults) {
      return { data: [], error: this.mockErrors.getAccessibleVaults };
    }
    return { data: this.mockVaults, error: null };
  }

  async createVault(vaultData) {
    if (this.mockErrors.createVault) {
      return { data: null, error: this.mockErrors.createVault };
    }
    const newVault = {
      id: `vault-${Date.now()}`,
      invite_code: this.generateInviteCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...vaultData
    };
    this.mockVaults.push(newVault);
    return { data: newVault, error: null };
  }

  async updateVault(vaultId, updates) {
    if (this.mockErrors.updateVault) {
      return { data: null, error: this.mockErrors.updateVault };
    }
    const index = this.mockVaults.findIndex(v => v.id === vaultId);
    if (index === -1) {
      return { data: null, error: new Error('Vault not found') };
    }
    this.mockVaults[index] = { ...this.mockVaults[index], ...updates, updated_at: new Date().toISOString() };
    return { data: this.mockVaults[index], error: null };
  }

  async deleteVault(vaultId) {
    if (this.mockErrors.deleteVault) {
      return { error: this.mockErrors.deleteVault };
    }
    this.mockVaults = this.mockVaults.filter(v => v.id !== vaultId);
    return { error: null };
  }

  async regenerateInviteCode(vaultId) {
    if (this.mockErrors.regenerateInviteCode) {
      return { data: null, error: this.mockErrors.regenerateInviteCode };
    }
    const newCode = this.generateInviteCode();
    const index = this.mockVaults.findIndex(v => v.id === vaultId);
    if (index === -1) {
      return { data: null, error: new Error('Vault not found') };
    }
    this.mockVaults[index].invite_code = newCode;
    return { data: newCode, error: null };
  }

  async joinVaultByCode(code, userId) {
    if (this.mockErrors.joinVaultByCode) {
      return { data: null, error: this.mockErrors.joinVaultByCode };
    }
    const vault = this.mockVaults.find(v => v.invite_code === code);
    if (!vault) {
      return { data: null, error: new Error('Invalid invite code') };
    }
    return { data: vault, error: null };
  }

  async transferOwnership(vaultId, newOwnerUserId) {
    if (this.mockErrors.transferOwnership) {
      return { error: this.mockErrors.transferOwnership };
    }
    const index = this.mockVaults.findIndex(v => v.id === vaultId);
    if (index === -1) {
      return { error: new Error('Vault not found') };
    }
    this.mockVaults[index].owner_id = newOwnerUserId;
    return { error: null };
  }

  async leaveVault(vaultId, userId, members) {
    if (this.mockErrors.leaveVault) {
      return { error: this.mockErrors.leaveVault };
    }
    const isOwner = members.some(m => m.user_id === userId && m.role === 'owner');
    if (isOwner && members.length > 1) {
      return { error: new Error('Cannot leave vault as owner. Transfer ownership first.') };
    }
    if (isOwner && members.length === 1) {
      this.mockVaults = this.mockVaults.filter(v => v.id !== vaultId);
    }
    return { error: null };
  }

  generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
