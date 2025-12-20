/**
 * Integration Tests for SupabaseVaultMemberService
 *
 * Tests all vault member operations against the real Supabase instance.
 * Covers member CRUD operations and role validation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SupabaseVaultMemberService } from '../../src/services/vaultMember/SupabaseVaultMemberService.js';
import { SupabaseVaultService } from '../../src/services/vault/SupabaseVaultService.js';
import {
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  generateTestId,
  cleanupTestData,
} from './setup.js';

describe('SupabaseVaultMemberService Integration Tests', () => {
  let serviceRoleClient;
  let testUser1;
  let testUser2;
  let testUser3;
  let testUser1Email;
  let testUser2Email;
  let testUser3Email;
  const testUserPassword = 'TestPassword123!';
  const createdVaultIds = [];

  beforeAll(async () => {
    serviceRoleClient = createServiceRoleClient();
    const testId = generateTestId();

    testUser1Email = `member_test1_${testId}@colabmusic-test.com`;
    testUser2Email = `member_test2_${testId}@colabmusic-test.com`;
    testUser3Email = `member_test3_${testId}@colabmusic-test.com`;

    testUser1 = await createTestUser(serviceRoleClient, testUser1Email, testUserPassword);
    testUser2 = await createTestUser(serviceRoleClient, testUser2Email, testUserPassword);
    testUser3 = await createTestUser(serviceRoleClient, testUser3Email, testUserPassword);
  });

  afterAll(async () => {
    // Cleanup vaults
    if (createdVaultIds.length > 0) {
      await cleanupTestData(serviceRoleClient, { vaultIds: createdVaultIds });
    }

    // Cleanup users
    if (testUser1?.id) await deleteTestUser(serviceRoleClient, testUser1.id);
    if (testUser2?.id) await deleteTestUser(serviceRoleClient, testUser2.id);
    if (testUser3?.id) await deleteTestUser(serviceRoleClient, testUser3.id);
  });

  describe('addMember()', () => {
    it('should add a member to a vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      // Create vault
      const { data: vault } = await vaultService.createVault({
        name: `Add Member Test ${generateTestId()}`,
        color: '#ADD111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Add member
      const { error } = await memberService.addMember(vault.id, testUser2.id, 'member');

      expect(error).toBeNull();

      // Verify member was added
      const { data: members } = await memberService.getVaultMembers(vault.id);
      const addedMember = members.find(m => m.user_id === testUser2.id);
      expect(addedMember).toBeDefined();
      expect(addedMember.role).toBe('member');

      await anonClient.auth.signOut();
    });

    it('should add a member with admin role', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Add Admin Test ${generateTestId()}`,
        color: '#ADD222',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const { error } = await memberService.addMember(vault.id, testUser2.id, 'admin');

      expect(error).toBeNull();

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const addedMember = members.find(m => m.user_id === testUser2.id);
      expect(addedMember).toBeDefined();
      expect(addedMember.role).toBe('admin');

      await anonClient.auth.signOut();
    });

    it('should add a member with viewer role', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Add Viewer Test ${generateTestId()}`,
        color: '#ADD333',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const { error } = await memberService.addMember(vault.id, testUser2.id, 'viewer');

      expect(error).toBeNull();

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const addedMember = members.find(m => m.user_id === testUser2.id);
      expect(addedMember).toBeDefined();
      expect(addedMember.role).toBe('viewer');

      await anonClient.auth.signOut();
    });

    it('should add multiple members to same vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Multi Member Test ${generateTestId()}`,
        color: '#ADD444',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Add two members
      await memberService.addMember(vault.id, testUser2.id, 'member');
      await memberService.addMember(vault.id, testUser3.id, 'admin');

      const { data: members } = await memberService.getVaultMembers(vault.id);

      expect(members.length).toBeGreaterThanOrEqual(2);
      expect(members.find(m => m.user_id === testUser2.id)).toBeDefined();
      expect(members.find(m => m.user_id === testUser3.id)).toBeDefined();

      await anonClient.auth.signOut();
    });
  });

  describe('getVaultMembers()', () => {
    it('should return all members of a vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Get Members Test ${generateTestId()}`,
        color: '#GET111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');
      await memberService.addMember(vault.id, testUser3.id, 'viewer');

      const { data, error } = await memberService.getVaultMembers(vault.id);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      // Check all expected fields are present
      const member = data[0];
      expect(member.id).toBeDefined();
      expect(member.vault_id).toBe(vault.id);
      expect(member.user_id).toBeDefined();
      expect(member.role).toBeDefined();

      await anonClient.auth.signOut();
    });

    it('should return empty array for vault with no members', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Empty Members Test ${generateTestId()}`,
        color: '#GET222',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const { data, error } = await memberService.getVaultMembers(vault.id);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      // Vault has no members added (owner is stored differently)
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });

    it('should order members by joined_at ascending', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Order Members Test ${generateTestId()}`,
        color: '#GET333',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Add members with slight delay
      await memberService.addMember(vault.id, testUser2.id, 'member');
      await new Promise(resolve => setTimeout(resolve, 50));
      await memberService.addMember(vault.id, testUser3.id, 'admin');

      const { data: members } = await memberService.getVaultMembers(vault.id);

      const user2Index = members.findIndex(m => m.user_id === testUser2.id);
      const user3Index = members.findIndex(m => m.user_id === testUser3.id);

      // user2 should appear before user3 (joined first)
      expect(user2Index).toBeLessThan(user3Index);

      await anonClient.auth.signOut();
    });
  });

  describe('updateMemberRole()', () => {
    it('should update member role to admin', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Update Role Test ${generateTestId()}`,
        color: '#UPD111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');

      // Get member ID
      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member = members.find(m => m.user_id === testUser2.id);

      // Update role
      const { error } = await memberService.updateMemberRole(member.id, 'admin');

      expect(error).toBeNull();

      // Verify role was updated
      const { data: updatedMembers } = await memberService.getVaultMembers(vault.id);
      const updatedMember = updatedMembers.find(m => m.user_id === testUser2.id);
      expect(updatedMember.role).toBe('admin');

      await anonClient.auth.signOut();
    });

    it('should update member role to viewer', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Update to Viewer Test ${generateTestId()}`,
        color: '#UPD222',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'admin');

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member = members.find(m => m.user_id === testUser2.id);

      const { error } = await memberService.updateMemberRole(member.id, 'viewer');

      expect(error).toBeNull();

      const { data: updatedMembers } = await memberService.getVaultMembers(vault.id);
      const updatedMember = updatedMembers.find(m => m.user_id === testUser2.id);
      expect(updatedMember.role).toBe('viewer');

      await anonClient.auth.signOut();
    });

    it('should return error for invalid role', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Invalid Role Test ${generateTestId()}`,
        color: '#UPD333',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member = members.find(m => m.user_id === testUser2.id);

      const { error } = await memberService.updateMemberRole(member.id, 'invalid_role');

      expect(error).toBeDefined();
      expect(error.message).toContain('Invalid role');

      await anonClient.auth.signOut();
    });

    it('should not allow setting role to owner via updateMemberRole', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Owner Role Test ${generateTestId()}`,
        color: '#UPD444',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member = members.find(m => m.user_id === testUser2.id);

      // Try to set role to owner (not in valid roles list)
      const { error } = await memberService.updateMemberRole(member.id, 'owner');

      expect(error).toBeDefined();

      await anonClient.auth.signOut();
    });
  });

  describe('removeMember()', () => {
    it('should remove a member from vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Remove Member Test ${generateTestId()}`,
        color: '#REM111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member = members.find(m => m.user_id === testUser2.id);

      const { error } = await memberService.removeMember(member.id);

      expect(error).toBeNull();

      // Verify member was removed
      const { data: updatedMembers } = await memberService.getVaultMembers(vault.id);
      const removedMember = updatedMembers.find(m => m.user_id === testUser2.id);
      expect(removedMember).toBeUndefined();

      await anonClient.auth.signOut();
    });

    it('should remove only specified member', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Remove Specific Test ${generateTestId()}`,
        color: '#REM222',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');
      await memberService.addMember(vault.id, testUser3.id, 'admin');

      const { data: members } = await memberService.getVaultMembers(vault.id);
      const member2 = members.find(m => m.user_id === testUser2.id);

      // Remove only user2
      await memberService.removeMember(member2.id);

      const { data: updatedMembers } = await memberService.getVaultMembers(vault.id);

      // user2 should be gone
      expect(updatedMembers.find(m => m.user_id === testUser2.id)).toBeUndefined();
      // user3 should still be there
      expect(updatedMembers.find(m => m.user_id === testUser3.id)).toBeDefined();

      await anonClient.auth.signOut();
    });
  });
});
