/**
 * Integration Tests for SupabaseSongService
 *
 * Tests all song operations against the real Supabase instance.
 * Covers song CRUD operations and vault-song relationships.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseSongService } from '../../src/services/song/SupabaseSongService.js';
import { SupabaseVaultService } from '../../src/services/vault/SupabaseVaultService.js';
import {
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  generateTestId,
  cleanupTestData,
} from './setup.js';

describe('SupabaseSongService Integration Tests', () => {
  let serviceRoleClient;
  let testUser1;
  let testUser1Email;
  const testUserPassword = 'TestPassword123!';
  const createdVaultIds = [];
  const createdSongIds = [];

  beforeAll(async () => {
    serviceRoleClient = createServiceRoleClient();
    const testId = generateTestId();

    testUser1Email = `song_test1_${testId}@colabmusic-test.com`;

    testUser1 = await createTestUser(serviceRoleClient, testUser1Email, testUserPassword);
  });

  afterAll(async () => {
    // Cleanup songs and vaults
    await cleanupTestData(serviceRoleClient, {
      songIds: createdSongIds,
      vaultIds: createdVaultIds,
    });

    // Cleanup user
    if (testUser1?.id) await deleteTestUser(serviceRoleClient, testUser1.id);
  });

  describe('createSong()', () => {
    it('should create a song with all metadata', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const songData = {
        title: `Test Song ${generateTestId()}`,
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        year: 2024,
        file_path: `${testUser1.id}/test-song.mp3`,
        cover_path: 'test-cover.jpg',
        uploaded_by: testUser1.id,
      };

      const { data, error } = await songService.createSong(songData);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.title).toBe(songData.title);
      expect(data.artist).toBe(songData.artist);
      expect(data.album).toBe(songData.album);
      expect(data.duration).toBe(songData.duration);
      expect(data.year).toBe(songData.year);
      expect(data.file_path).toBe(songData.file_path);
      expect(data.cover_path).toBe(songData.cover_path);
      expect(data.uploaded_by).toBe(testUser1.id);

      createdSongIds.push(data.id);

      await anonClient.auth.signOut();
    });

    it('should create a song with minimal metadata', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const songData = {
        title: `Minimal Song ${generateTestId()}`,
        file_path: `${testUser1.id}/minimal.mp3`,
        uploaded_by: testUser1.id,
      };

      const { data, error } = await songService.createSong(songData);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.title).toBe(songData.title);
      expect(data.file_path).toBe(songData.file_path);
      expect(data.artist).toBeNull();
      expect(data.album).toBeNull();

      createdSongIds.push(data.id);

      await anonClient.auth.signOut();
    });
  });

  describe('getSongById()', () => {
    it('should retrieve a song by ID', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      // Create a song first
      const { data: createdSong } = await songService.createSong({
        title: `GetById Test ${generateTestId()}`,
        artist: 'GetById Artist',
        file_path: `${testUser1.id}/getbyid.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(createdSong.id);

      // Retrieve it
      const { data, error } = await songService.getSongById(createdSong.id);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.id).toBe(createdSong.id);
      expect(data.title).toBe(createdSong.title);
      expect(data.artist).toBe(createdSong.artist);

      await anonClient.auth.signOut();
    });

    it('should return error for non-existent song ID', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data, error } = await songService.getSongById('00000000-0000-0000-0000-000000000000');

      // Supabase returns error when .single() finds no rows
      expect(error).not.toBeNull();
      expect(data).toBeNull();

      await anonClient.auth.signOut();
    });
  });

  describe('updateSong()', () => {
    it('should update song title', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data: song } = await songService.createSong({
        title: `Update Title Test ${generateTestId()}`,
        artist: 'Original Artist',
        file_path: `${testUser1.id}/update-title.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song.id);

      const newTitle = `Updated Title ${generateTestId()}`;
      const { data, error } = await songService.updateSong(song.id, { title: newTitle });

      expect(error).toBeNull();
      expect(data.title).toBe(newTitle);
      expect(data.artist).toBe('Original Artist'); // unchanged

      await anonClient.auth.signOut();
    });

    it('should update song artist', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data: song } = await songService.createSong({
        title: `Update Artist Test ${generateTestId()}`,
        artist: 'Original Artist',
        file_path: `${testUser1.id}/update-artist.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song.id);

      const newArtist = 'New Artist Name';
      const { data, error } = await songService.updateSong(song.id, { artist: newArtist });

      expect(error).toBeNull();
      expect(data.artist).toBe(newArtist);

      await anonClient.auth.signOut();
    });

    it('should update multiple fields at once', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data: song } = await songService.createSong({
        title: `Multi Update Test ${generateTestId()}`,
        artist: 'Original',
        album: 'Original Album',
        year: 2020,
        file_path: `${testUser1.id}/multi-update.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song.id);

      const updates = {
        title: 'Multi Updated Title',
        artist: 'Multi Updated Artist',
        album: 'Multi Updated Album',
        year: 2025,
      };

      const { data, error } = await songService.updateSong(song.id, updates);

      expect(error).toBeNull();
      expect(data.title).toBe(updates.title);
      expect(data.artist).toBe(updates.artist);
      expect(data.album).toBe(updates.album);
      expect(data.year).toBe(updates.year);

      await anonClient.auth.signOut();
    });
  });

  describe('deleteSong()', () => {
    it('should delete a song', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data: song } = await songService.createSong({
        title: `Delete Test ${generateTestId()}`,
        file_path: `${testUser1.id}/delete-test.mp3`,
        uploaded_by: testUser1.id,
      });
      // Don't add to createdSongIds since we're deleting it

      const { error } = await songService.deleteSong(song.id);

      expect(error).toBeNull();

      // Verify song is deleted
      const { data: fetchedSong, error: fetchError } = await songService.getSongById(song.id);
      expect(fetchedSong).toBeNull();
      expect(fetchError).not.toBeNull();

      await anonClient.auth.signOut();
    });
  });

  describe('linkSongToVault()', () => {
    it('should link a song to a vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);
      const vaultService = new SupabaseVaultService(anonClient);

      // Create vault
      const { data: vault } = await vaultService.createVault({
        name: `Link Song Test ${generateTestId()}`,
        color: '#LINK11',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Create song
      const { data: song } = await songService.createSong({
        title: `Link Test Song ${generateTestId()}`,
        file_path: `${testUser1.id}/link-test.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song.id);

      // Link song to vault
      const { error } = await songService.linkSongToVault(song.id, vault.id, testUser1.id);

      expect(error).toBeNull();

      // Verify link exists by getting songs for vault
      const { data: songs } = await songService.getSongsForVaults([vault.id]);
      const linkedSong = songs.find(s => s.id === song.id);
      expect(linkedSong).toBeDefined();

      await anonClient.auth.signOut();
    });

    it('should link same song to multiple vaults', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);
      const vaultService = new SupabaseVaultService(anonClient);

      // Create two vaults
      const { data: vault1 } = await vaultService.createVault({
        name: `Multi Link Vault 1 ${generateTestId()}`,
        color: '#LINK21',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault1.id);

      const { data: vault2 } = await vaultService.createVault({
        name: `Multi Link Vault 2 ${generateTestId()}`,
        color: '#LINK22',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault2.id);

      // Create song
      const { data: song } = await songService.createSong({
        title: `Multi Link Song ${generateTestId()}`,
        file_path: `${testUser1.id}/multi-link.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song.id);

      // Link to both vaults
      await songService.linkSongToVault(song.id, vault1.id, testUser1.id);
      await songService.linkSongToVault(song.id, vault2.id, testUser1.id);

      // Verify song appears in both vaults
      const { data: vault1Songs } = await songService.getSongsForVaults([vault1.id]);
      const { data: vault2Songs } = await songService.getSongsForVaults([vault2.id]);

      expect(vault1Songs.find(s => s.id === song.id)).toBeDefined();
      expect(vault2Songs.find(s => s.id === song.id)).toBeDefined();

      await anonClient.auth.signOut();
    });
  });

  describe('getSongsForVaults()', () => {
    it('should get all songs for specified vaults', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);
      const vaultService = new SupabaseVaultService(anonClient);

      // Create vault
      const { data: vault } = await vaultService.createVault({
        name: `Get Songs Test ${generateTestId()}`,
        color: '#GETS11',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Create and link multiple songs
      const song1Data = await songService.createSong({
        title: `Get Songs Test 1 ${generateTestId()}`,
        artist: 'Artist 1',
        file_path: `${testUser1.id}/getsongs1.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song1Data.data.id);
      await songService.linkSongToVault(song1Data.data.id, vault.id, testUser1.id);

      const song2Data = await songService.createSong({
        title: `Get Songs Test 2 ${generateTestId()}`,
        artist: 'Artist 2',
        file_path: `${testUser1.id}/getsongs2.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song2Data.data.id);
      await songService.linkSongToVault(song2Data.data.id, vault.id, testUser1.id);

      // Get songs for vault
      const { data, error } = await songService.getSongsForVaults([vault.id]);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      const foundSong1 = data.find(s => s.id === song1Data.data.id);
      const foundSong2 = data.find(s => s.id === song2Data.data.id);
      expect(foundSong1).toBeDefined();
      expect(foundSong2).toBeDefined();

      await anonClient.auth.signOut();
    });

    it('should get songs from multiple vaults', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);
      const vaultService = new SupabaseVaultService(anonClient);

      // Create two vaults
      const { data: vault1 } = await vaultService.createVault({
        name: `Multi Vault Songs 1 ${generateTestId()}`,
        color: '#GETS21',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault1.id);

      const { data: vault2 } = await vaultService.createVault({
        name: `Multi Vault Songs 2 ${generateTestId()}`,
        color: '#GETS22',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault2.id);

      // Create songs for each vault
      const { data: song1 } = await songService.createSong({
        title: `Multi Vault Song 1 ${generateTestId()}`,
        file_path: `${testUser1.id}/multi1.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song1.id);
      await songService.linkSongToVault(song1.id, vault1.id, testUser1.id);

      const { data: song2 } = await songService.createSong({
        title: `Multi Vault Song 2 ${generateTestId()}`,
        file_path: `${testUser1.id}/multi2.mp3`,
        uploaded_by: testUser1.id,
      });
      createdSongIds.push(song2.id);
      await songService.linkSongToVault(song2.id, vault2.id, testUser1.id);

      // Get songs from both vaults
      const { data, error } = await songService.getSongsForVaults([vault1.id, vault2.id]);

      expect(error).toBeNull();
      expect(data.find(s => s.id === song1.id)).toBeDefined();
      expect(data.find(s => s.id === song2.id)).toBeDefined();

      await anonClient.auth.signOut();
    });

    it('should return empty array for empty vault IDs', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data, error } = await songService.getSongsForVaults([]);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });

    it('should return empty array for null vault IDs', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);

      const { data, error } = await songService.getSongsForVaults(null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });

    it('should return empty array for vault with no songs', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const songService = new SupabaseSongService(anonClient);
      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Empty Vault Songs ${generateTestId()}`,
        color: '#GETS31',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const { data, error } = await songService.getSongsForVaults([vault.id]);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });
  });
});
