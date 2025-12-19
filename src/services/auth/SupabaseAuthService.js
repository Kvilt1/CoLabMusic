import { AuthService } from './AuthService';

/**
 * Supabase implementation of AuthService
 */
export class SupabaseAuthService extends AuthService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser();
    return { data: data?.user || null, error };
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    return { data: data?.session || null, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
