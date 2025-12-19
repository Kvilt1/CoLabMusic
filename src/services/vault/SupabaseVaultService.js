import { VaultService } from './VaultService';

/**
 * Supabase implementation of VaultService
 */
export class SupabaseVaultService extends VaultService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getUserVaults(userId) {
    const { data, error } = await this.supabase
      .from('vaults')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }

  async getAccessibleVaults(userId) {
    const { data, error } = await this.supabase
      .from('vault_members')
      .select('vault_id, vaults(*)')
      .eq('user_id', userId);

    if (error) return { data: [], error };

    const vaults = data.map(item => item.vaults).filter(Boolean);
    return { data: vaults, error: null };
  }

  async createVault(vaultData) {
    const inviteCode = this.generateInviteCode();
    const { data, error } = await this.supabase
      .from('vaults')
      .insert([{ ...vaultData, invite_code: inviteCode }])
      .select()
      .single();

    return { data, error };
  }

  async updateVault(vaultId, updates) {
    const { data, error } = await this.supabase
      .from('vaults')
      .update(updates)
      .eq('id', vaultId)
      .select()
      .single();

    return { data, error };
  }

  async deleteVault(vaultId) {
    const { error } = await this.supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId);

    return { error };
  }

  async regenerateInviteCode(vaultId) {
    const newCode = this.generateInviteCode();
    const { error } = await this.supabase
      .from('vaults')
      .update({ invite_code: newCode })
      .eq('id', vaultId);

    return { data: newCode, error };
  }

  async joinVaultByCode(code, userId) {
    const { data: vaultData, error: lookupError } = await this.supabase
      .rpc('get_vault_by_invite_code', { p_invite_code: code });

    if (lookupError || !vaultData || vaultData.length === 0) {
      return { data: null, error: lookupError || new Error('Invalid invite code') };
    }

    const vault = vaultData[0];
    const { error: memberError } = await this.supabase
      .from('vault_members')
      .insert([{
        vault_id: vault.id,
        user_id: userId,
        role: 'member'
      }]);

    if (memberError) {
      return { data: null, error: memberError };
    }

    return { data: vault, error: null };
  }

  async transferOwnership(vaultId, newOwnerUserId) {
    const { error: updateVaultError } = await this.supabase
      .from('vaults')
      .update({ owner_id: newOwnerUserId })
      .eq('id', vaultId);

    if (updateVaultError) {
      return { error: updateVaultError };
    }

    const { error: updateMemberError } = await this.supabase
      .from('vault_members')
      .update({ role: 'owner' })
      .eq('vault_id', vaultId)
      .eq('user_id', newOwnerUserId);

    return { error: updateMemberError };
  }

  async leaveVault(vaultId, userId, members) {
    const isOwner = members.some(m => m.user_id === userId && m.role === 'owner');

    if (isOwner && members.length > 1) {
      return { error: new Error('Cannot leave vault as owner. Transfer ownership first.') };
    }

    if (isOwner && members.length === 1) {
      const { error: deleteError } = await this.supabase
        .from('vaults')
        .delete()
        .eq('id', vaultId);
      return { error: deleteError };
    }

    const { error } = await this.supabase
      .from('vault_members')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', userId);

    return { error };
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
