/**
 * Integration Test Setup
 *
 * Provides Supabase clients and test utilities for integration testing.
 * Uses real Supabase instance with test data that gets cleaned up.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://kaupdktbxmojqiazfnrm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXBka3RieG1vanFpYXpmbnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjU1NzksImV4cCI6MjA4MTY0MTU3OX0.preWwGRRdR8UKIFYr4HLUl5OmJuFwUM5aA16etx3dU0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXBka3RieG1vanFpYXpmbnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA2NTU3OSwiZXhwIjoyMDgxNjQxNTc5fQ.9XW_s_7Puuu991uO2ZLnVXBy95GeR-fo8eIr3wX5ED8';

/**
 * Create a Supabase client with anon key (respects RLS)
 */
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    },
  });
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Use this for test setup/cleanup operations
 */
export function createServiceRoleClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  });
}

/**
 * Test user credentials
 * These users should be created in Supabase for testing
 */
export const TEST_USERS = {
  user1: {
    email: 'testuser1@colabmusic-test.com',
    password: 'TestPassword123!',
  },
  user2: {
    email: 'testuser2@colabmusic-test.com',
    password: 'TestPassword123!',
  },
};

/**
 * Generate a unique test identifier to avoid conflicts
 */
export function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a test user using service role client
 * Returns the user object
 */
export async function createTestUser(serviceClient, email, password) {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // User might already exist, try to get them
    if (error.message?.includes('already been registered')) {
      const { data: { users } } = await serviceClient.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === email);
      return existingUser;
    }
    throw error;
  }

  return data.user;
}

/**
 * Delete a test user using service role client
 */
export async function deleteTestUser(serviceClient, userId) {
  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error && !error.message?.includes('not found')) {
    throw error;
  }
}

/**
 * Sign in as a test user
 * Returns the authenticated client
 */
export async function signInAsTestUser(email, password) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return { client, user: data.user, session: data.session };
}

/**
 * Clean up test data created during tests
 * Uses service role client to bypass RLS
 */
export async function cleanupTestData(serviceClient, options = {}) {
  const { vaultIds = [], songIds = [], userIds = [] } = options;

  // Delete vault_songs first (foreign key constraint)
  if (vaultIds.length > 0) {
    await serviceClient.from('vault_songs').delete().in('vault_id', vaultIds);
  }

  // Delete vault_members
  if (vaultIds.length > 0) {
    await serviceClient.from('vault_members').delete().in('vault_id', vaultIds);
  }

  // Delete songs
  if (songIds.length > 0) {
    await serviceClient.from('songs').delete().in('id', songIds);
  }

  // Delete vaults
  if (vaultIds.length > 0) {
    await serviceClient.from('vaults').delete().in('id', vaultIds);
  }

  // Delete users
  for (const userId of userIds) {
    await deleteTestUser(serviceClient, userId);
  }
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create sample audio file data for testing uploads
 * Returns a minimal valid MP3 file buffer
 */
export function createTestAudioFile() {
  // Minimal MP3 file header (just for testing, not a real audio file)
  const mp3Header = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
    0x00, 0x00, 0x00, 0x00, // Padding
  ]);

  return new Blob([mp3Header], { type: 'audio/mpeg' });
}

/**
 * Create sample image file data for testing cover uploads
 */
export function createTestImageFile() {
  // Minimal PNG file (1x1 transparent pixel)
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82,
  ]);

  return new Blob([pngData], { type: 'image/png' });
}

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY };
