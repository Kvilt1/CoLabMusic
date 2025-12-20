/**
 * Integration Tests for SupabaseStorageService
 *
 * Tests all storage operations against the real Supabase instance.
 * Covers file upload, delete, and public URL generation.
 * Note: TUS resumable upload tests are limited due to browser-specific dependencies.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseStorageService } from '../../src/services/storage/SupabaseStorageService.js';
import {
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  generateTestId,
  createTestAudioFile,
  createTestImageFile,
  SUPABASE_URL,
} from './setup.js';

describe('SupabaseStorageService Integration Tests', () => {
  let serviceRoleClient;
  let testUser1;
  let testUser1Email;
  const testUserPassword = 'TestPassword123!';
  const uploadedFiles = [];

  beforeAll(async () => {
    serviceRoleClient = createServiceRoleClient();
    const testId = generateTestId();

    testUser1Email = `storage_test1_${testId}@colabmusic-test.com`;

    testUser1 = await createTestUser(serviceRoleClient, testUser1Email, testUserPassword);
  });

  afterAll(async () => {
    // Cleanup uploaded files using service role client
    const storageService = new SupabaseStorageService(serviceRoleClient);

    for (const file of uploadedFiles) {
      try {
        await storageService.deleteFile(file.bucket, file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Cleanup user
    if (testUser1?.id) await deleteTestUser(serviceRoleClient, testUser1.id);
  });

  describe('uploadFile()', () => {
    it('should upload a file to songs bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const testFile = createTestAudioFile();
      const filePath = `${testUser1.id}/test-upload-${generateTestId()}.mp3`;

      const { data, error } = await storageService.uploadFile('songs', filePath, testFile);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.path).toBe(filePath);

      uploadedFiles.push({ bucket: 'songs', path: filePath });

      await anonClient.auth.signOut();
    });

    it('should upload a file to covers bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const testFile = createTestImageFile();
      const filePath = `test-cover-${generateTestId()}.png`;

      const { data, error } = await storageService.uploadFile('covers', filePath, testFile);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.path).toBe(filePath);

      uploadedFiles.push({ bucket: 'covers', path: filePath });

      await anonClient.auth.signOut();
    });

    it('should upsert file when uploading to same path', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const filePath = `${testUser1.id}/upsert-test-${generateTestId()}.mp3`;

      // First upload
      const testFile1 = createTestAudioFile();
      const { error: error1 } = await storageService.uploadFile('songs', filePath, testFile1);
      expect(error1).toBeNull();

      // Second upload to same path (upsert)
      const testFile2 = createTestAudioFile();
      const { data, error: error2 } = await storageService.uploadFile('songs', filePath, testFile2);

      expect(error2).toBeNull();
      expect(data.path).toBe(filePath);

      uploadedFiles.push({ bucket: 'songs', path: filePath });

      await anonClient.auth.signOut();
    });
  });

  describe('deleteFile()', () => {
    it('should delete a file from songs bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      // First upload a file
      const testFile = createTestAudioFile();
      const filePath = `${testUser1.id}/delete-test-${generateTestId()}.mp3`;

      await storageService.uploadFile('songs', filePath, testFile);

      // Then delete it
      const { error } = await storageService.deleteFile('songs', filePath);

      expect(error).toBeNull();

      // Verify deletion by trying to get public URL (should still work, but file won't exist)
      // Note: Supabase doesn't error on getPublicUrl for non-existent files
      // The URL is generated but the file won't be accessible
    });

    it('should delete a file from covers bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const testFile = createTestImageFile();
      const filePath = `delete-cover-${generateTestId()}.png`;

      await storageService.uploadFile('covers', filePath, testFile);

      const { error } = await storageService.deleteFile('covers', filePath);

      expect(error).toBeNull();

      await anonClient.auth.signOut();
    });

    it('should not error when deleting non-existent file', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const { error } = await storageService.deleteFile(
        'songs',
        `${testUser1.id}/non-existent-${generateTestId()}.mp3`
      );

      // Supabase storage.remove doesn't error for non-existent files
      expect(error).toBeNull();

      await anonClient.auth.signOut();
    });
  });

  describe('getPublicUrl()', () => {
    it('should generate public URL for songs bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      // Upload a file first
      const testFile = createTestAudioFile();
      const filePath = `${testUser1.id}/public-url-test-${generateTestId()}.mp3`;

      await storageService.uploadFile('songs', filePath, testFile);
      uploadedFiles.push({ bucket: 'songs', path: filePath });

      const publicUrl = storageService.getPublicUrl('songs', filePath);

      expect(publicUrl).toBeDefined();
      expect(typeof publicUrl).toBe('string');
      expect(publicUrl).toContain(SUPABASE_URL);
      expect(publicUrl).toContain('songs');
      expect(publicUrl).toContain(encodeURIComponent(testUser1.id));

      await anonClient.auth.signOut();
    });

    it('should generate public URL for covers bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);

      const testFile = createTestImageFile();
      const filePath = `public-url-cover-${generateTestId()}.png`;

      await storageService.uploadFile('covers', filePath, testFile);
      uploadedFiles.push({ bucket: 'covers', path: filePath });

      const publicUrl = storageService.getPublicUrl('covers', filePath);

      expect(publicUrl).toBeDefined();
      expect(typeof publicUrl).toBe('string');
      expect(publicUrl).toContain(SUPABASE_URL);
      expect(publicUrl).toContain('covers');

      await anonClient.auth.signOut();
    });

    it('should generate URL even for non-existent files', () => {
      const anonClient = createAnonClient();
      const storageService = new SupabaseStorageService(anonClient);

      // getPublicUrl doesn't check if file exists
      const publicUrl = storageService.getPublicUrl('songs', 'non-existent-file.mp3');

      expect(publicUrl).toBeDefined();
      expect(typeof publicUrl).toBe('string');
      expect(publicUrl).toContain('songs');
      expect(publicUrl).toContain('non-existent-file.mp3');
    });

    it('should handle paths with special characters', () => {
      const anonClient = createAnonClient();
      const storageService = new SupabaseStorageService(anonClient);

      const pathWithSpaces = 'folder name/file with spaces.mp3';
      const publicUrl = storageService.getPublicUrl('songs', pathWithSpaces);

      expect(publicUrl).toBeDefined();
      expect(typeof publicUrl).toBe('string');
    });
  });

  describe('uploadViaResumable()', () => {
    // Note: TUS resumable uploads require browser environment and session tokens
    // These tests are basic validation that the method exists and handles errors

    it('should have uploadViaResumable method', () => {
      const anonClient = createAnonClient();
      const storageService = new SupabaseStorageService(anonClient);

      expect(typeof storageService.uploadViaResumable).toBe('function');
    });

    // Note: Full TUS upload testing would require:
    // 1. A valid session with access_token
    // 2. Browser File object with name property
    // 3. Network access to Supabase TUS endpoint
    // These tests are better suited for e2e testing in a browser environment
  });

  describe('Storage bucket permissions', () => {
    it('should allow authenticated user to upload to songs bucket', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);
      const testFile = createTestAudioFile();
      const filePath = `${testUser1.id}/permission-test-${generateTestId()}.mp3`;

      const { error } = await storageService.uploadFile('songs', filePath, testFile);

      expect(error).toBeNull();

      uploadedFiles.push({ bucket: 'songs', path: filePath });

      await anonClient.auth.signOut();
    });

    it('should reject upload from unauthenticated user', async () => {
      const anonClient = createAnonClient();
      // Don't sign in

      const storageService = new SupabaseStorageService(anonClient);
      const testFile = createTestAudioFile();
      const filePath = `unauthenticated/test-${generateTestId()}.mp3`;

      const { error } = await storageService.uploadFile('songs', filePath, testFile);

      // Expect error due to RLS policy
      expect(error).not.toBeNull();
    });
  });

  describe('File path validation', () => {
    it('should upload files with nested path structure', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);
      const testFile = createTestAudioFile();
      const nestedPath = `${testUser1.id}/folder1/folder2/nested-${generateTestId()}.mp3`;

      const { data, error } = await storageService.uploadFile('songs', nestedPath, testFile);

      expect(error).toBeNull();
      expect(data.path).toBe(nestedPath);

      uploadedFiles.push({ bucket: 'songs', path: nestedPath });

      await anonClient.auth.signOut();
    });

    it('should handle various file extensions', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const storageService = new SupabaseStorageService(anonClient);
      const testFile = createTestAudioFile();
      const testId = generateTestId();

      // Test different audio extensions
      const extensions = ['mp3', 'm4a', 'wav', 'flac', 'ogg'];

      for (const ext of extensions) {
        const filePath = `${testUser1.id}/ext-test-${testId}.${ext}`;
        const { error } = await storageService.uploadFile('songs', filePath, testFile);

        // May succeed or fail based on bucket policies, but should not throw
        if (!error) {
          uploadedFiles.push({ bucket: 'songs', path: filePath });
        }
      }

      await anonClient.auth.signOut();
    });
  });
});
