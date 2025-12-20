/**
 * Integration Tests for SupabaseAuthService
 *
 * Tests all authentication operations against the real Supabase instance.
 * Uses the service role client for test user management.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { SupabaseAuthService } from '../../src/services/auth/SupabaseAuthService.js';
import {
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  generateTestId,
  wait,
} from './setup.js';

describe('SupabaseAuthService Integration Tests', () => {
  let serviceRoleClient;
  let testUser;
  let testUserEmail;
  let testUserPassword;

  beforeAll(async () => {
    serviceRoleClient = createServiceRoleClient();
    const testId = generateTestId();
    testUserEmail = `auth_test_${testId}@colabmusic-test.com`;
    testUserPassword = 'TestPassword123!';

    // Create test user
    testUser = await createTestUser(serviceRoleClient, testUserEmail, testUserPassword);
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUser?.id) {
      await deleteTestUser(serviceRoleClient, testUser.id);
    }
  });

  describe('getUser()', () => {
    it('should return null when not authenticated', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      const { data, error } = await authService.getUser();

      // When not authenticated, getUser returns null data (no error)
      expect(data).toBeNull();
    });

    it('should return user when authenticated', async () => {
      const anonClient = createAnonClient();

      // Sign in first
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const authService = new SupabaseAuthService(anonClient);
      const { data, error } = await authService.getUser();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.email).toBe(testUserEmail);

      // Clean up - sign out
      await anonClient.auth.signOut();
    });
  });

  describe('getSession()', () => {
    it('should return null session when not authenticated', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      const { data, error } = await authService.getSession();

      expect(data).toBeNull();
    });

    it('should return session when authenticated', async () => {
      const anonClient = createAnonClient();

      // Sign in first
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const authService = new SupabaseAuthService(anonClient);
      const { data, error } = await authService.getSession();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUserEmail);

      // Clean up - sign out
      await anonClient.auth.signOut();
    });
  });

  describe('signOut()', () => {
    it('should sign out an authenticated user', async () => {
      const anonClient = createAnonClient();

      // Sign in first
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const authService = new SupabaseAuthService(anonClient);

      // Verify signed in
      const { data: beforeUser } = await authService.getUser();
      expect(beforeUser).not.toBeNull();

      // Sign out
      const { error } = await authService.signOut();
      expect(error).toBeNull();

      // Verify signed out
      const { data: afterUser } = await authService.getUser();
      expect(afterUser).toBeNull();
    });

    it('should not error when signing out while not authenticated', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      const { error } = await authService.signOut();

      // Supabase doesn't error on signing out when not signed in
      expect(error).toBeNull();
    });
  });

  describe('onAuthStateChange()', () => {
    it('should set up auth state listener', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      let callbackCalled = false;
      let receivedEvent = null;

      const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
        callbackCalled = true;
        receivedEvent = event;
      });

      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');

      // Give it a moment for initial callback
      await wait(100);

      // The callback is called with INITIAL_SESSION on setup
      expect(callbackCalled).toBe(true);

      // Clean up
      subscription.unsubscribe();
    });

    it('should fire callback on sign in', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      const events = [];

      const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
        events.push({ event, hasSession: !!session });
      });

      // Give initial callback time to fire
      await wait(100);

      // Sign in
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      // Wait for auth state change callback
      await wait(200);

      // Should have received SIGNED_IN event
      const signInEvent = events.find(e => e.event === 'SIGNED_IN');
      expect(signInEvent).toBeDefined();
      expect(signInEvent.hasSession).toBe(true);

      // Clean up
      await anonClient.auth.signOut();
      subscription.unsubscribe();
    });

    it('should fire callback on sign out', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      // Sign in first
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const events = [];

      const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
        events.push({ event, hasSession: !!session });
      });

      // Give initial callback time to fire
      await wait(100);

      // Sign out
      await authService.signOut();

      // Wait for auth state change callback
      await wait(200);

      // Should have received SIGNED_OUT event
      const signOutEvent = events.find(e => e.event === 'SIGNED_OUT');
      expect(signOutEvent).toBeDefined();
      expect(signOutEvent.hasSession).toBe(false);

      // Clean up
      subscription.unsubscribe();
    });

    it('should allow unsubscribe from auth state changes', async () => {
      const anonClient = createAnonClient();
      const authService = new SupabaseAuthService(anonClient);

      let callCount = 0;

      const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
        callCount++;
      });

      // Wait for initial callback
      await wait(100);
      const initialCount = callCount;

      // Unsubscribe
      subscription.unsubscribe();

      // Sign in - should not trigger callback
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      await wait(200);

      // Call count should not have increased after unsubscribe
      expect(callCount).toBe(initialCount);

      // Clean up
      await anonClient.auth.signOut();
    });
  });
});
