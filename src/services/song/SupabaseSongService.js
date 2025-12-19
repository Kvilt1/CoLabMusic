import { SongService } from './SongService';

/**
 * Supabase implementation of SongService
 */
export class SupabaseSongService extends SongService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getSongsForVaults(vaultIds) {
    if (!vaultIds || vaultIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await this.supabase
      .from('vault_songs')
      .select('song_id, songs(*)')
      .in('vault_id', vaultIds);

    if (error) return { data: [], error };

    const songs = data.map(item => item.songs).filter(Boolean);
    return { data: songs, error: null };
  }

  async getSongById(songId) {
    const { data, error } = await this.supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single();

    return { data, error };
  }

  async createSong(songData) {
    const { data, error } = await this.supabase
      .from('songs')
      .insert([songData])
      .select()
      .single();

    return { data, error };
  }

  async updateSong(songId, updates) {
    const { data, error } = await this.supabase
      .from('songs')
      .update(updates)
      .eq('id', songId)
      .select()
      .single();

    return { data, error };
  }

  async deleteSong(songId) {
    const { error } = await this.supabase
      .from('songs')
      .delete()
      .eq('id', songId);

    return { error };
  }

  async linkSongToVault(songId, vaultId, addedBy) {
    const { error } = await this.supabase
      .from('vault_songs')
      .insert([{
        song_id: songId,
        vault_id: vaultId,
        added_by: addedBy
      }]);

    return { error };
  }
}
