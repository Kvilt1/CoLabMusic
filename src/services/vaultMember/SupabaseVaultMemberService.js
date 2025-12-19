import { VaultMemberService } from './VaultMemberService';

/**
 * Supabase implementation of VaultMemberService
 */
export class SupabaseVaultMemberService extends VaultMemberService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getVaultMembers(vaultId) {
    const { data, error } = await this.supabase
      .from('vault_members')
      .select('*')
      .eq('vault_id', vaultId)
      .order('joined_at', { ascending: true });

    return { data: data || [], error };
  }

  async addMember(vaultId, userId, role) {
    const { error } = await this.supabase
      .from('vault_members')
      .insert([{
        vault_id: vaultId,
        user_id: userId,
        role
      }]);

    return { error };
  }

  async updateMemberRole(memberId, role) {
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return { error: new Error('Invalid role') };
    }

    const { error } = await this.supabase
      .from('vault_members')
      .update({ role })
      .eq('id', memberId);

    return { error };
  }

  async removeMember(memberId) {
    const { error } = await this.supabase
      .from('vault_members')
      .delete()
      .eq('id', memberId);

    return { error };
  }
}
