import { RealtimeService } from './RealtimeService';

/**
 * Supabase implementation of RealtimeService
 */
export class SupabaseRealtimeService extends RealtimeService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
    this.channels = [];
  }

  subscribeToVaults(callback) {
    const channel = this.supabase
      .channel('vaults-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vaults'
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.push(channel);

    return {
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.channels = this.channels.filter(c => c !== channel);
      }
    };
  }

  subscribeToSongs(callback) {
    const channel = this.supabase
      .channel('songs-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'songs'
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.push(channel);

    return {
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.channels = this.channels.filter(c => c !== channel);
      }
    };
  }

  subscribeToVaultSongs(callback) {
    const channel = this.supabase
      .channel('vault-songs-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vault_songs'
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.push(channel);

    return {
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
        this.channels = this.channels.filter(c => c !== channel);
      }
    };
  }

  unsubscribeAll() {
    this.channels.forEach(channel => {
      this.supabase.removeChannel(channel);
    });
    this.channels = [];
  }
}
