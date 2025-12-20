/**
 * Integration Tests for SupabaseVaultService
 *
 * Tests all vault operations against the real Supabase instance.
 * Covers CRUD operations, invite codes, ownership transfers, and leave logic.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { SupabaseVaultService } from '../../src/services/vault/SupabaseVaultService.js';
import { SupabaseVaultMemberService } from '../../src/services/vaultMember/SupabaseVaultMemberService.js';
import {
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  generateTestId,
  cleanupTestData,
  wait,
} from './setup.js';

describe('SupabaseVaultService Integration Tests', () => {
  let serviceRoleClient;
  let testUser1;
  let testUser2;
  let testUser1Email;
  let testUser2Email;
  const testUserPassword = 'TestPassword123!';
  const createdVaultIds = [];

  beforeAll(async () => {
    serviceRoleClient = createServiceRoleClient();
    const testId = generateTestId();

    testUser1Email = `vault_test1_${testId}@colabmusic-test.com`;
    testUser2Email = `vault_test2_${testId}@colabmusic-test.com`;

    testUser1 = await createTestUser(serviceRoleClient, testUser1Email, testUserPassword);
    testUser2 = await createTestUser(serviceRoleClient, testUser2Email, testUserPassword);
  });

  afterAll(async () => {
    // Cleanup all created vaults
    if (createdVaultIds.length > 0) {
      await cleanupTestData(serviceRoleClient, { vaultIds: createdVaultIds });
    }

    // Cleanup test users
    if (testUser1?.id) await deleteTestUser(serviceRoleClient, testUser1.id);
    if (testUser2?.id) await deleteTestUser(serviceRoleClient, testUser2.id);
  });

  describe('createVault()', () => {
    it('should create a vault with auto-generated invite code', async () => {
      const anonClient = createAnonClient();

      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const vaultData = {
        name: `Test Vault ${generateTestId()}`,
        color: '#FF5733',
        owner_id: testUser1.id,
      };

      const { data, error } = await vaultService.createVault(vaultData);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.name).toBe(vaultData.name);
      expect(data.color).toBe(vaultData.color);
      expect(data.owner_id).toBe(testUser1.id);
      expect(data.invite_code).toBeDefined();
      expect(data.invite_code.length).toBe(6);

      createdVaultIds.push(data.id);

      await anonClient.auth.signOut();
    });

    it('should create multiple vaults for same user', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const vault1 = await vaultService.createVault({
        name: `Vault A ${generateTestId()}`,
        color: '#00FF00',
        owner_id: testUser1.id,
      });

      const vault2 = await vaultService.createVault({
        name: `Vault B ${generateTestId()}`,
        color: '#0000FF',
        owner_id: testUser1.id,
      });

      expect(vault1.error).toBeNull();
      expect(vault2.error).toBeNull();
      expect(vault1.data.id).not.toBe(vault2.data.id);
      expect(vault1.data.invite_code).not.toBe(vault2.data.invite_code);

      createdVaultIds.push(vault1.data.id, vault2.data.id);

      await anonClient.auth.signOut();
    });
  });

  describe('getUserVaults()', () => {
    it('should return vaults owned by user', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      // Create a vault first
      const { data: vault } = await vaultService.createVault({
        name: `GetUserVaults Test ${generateTestId()}`,
        color: '#123456',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Get user vaults
      const { data, error } = await vaultService.getUserVaults(testUser1.id);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const foundVault = data.find(v => v.id === vault.id);
      expect(foundVault).toBeDefined();
      expect(foundVault.name).toBe(vault.name);

      await anonClient.auth.signOut();
    });

    it('should return empty array for user with no vaults', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      // Query with a fake user ID that owns no vaults
      const { data, error } = await vaultService.getUserVaults('00000000-0000-0000-0000-000000000000');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });

    it('should order vaults by created_at descending', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      // Create two vaults with a small delay
      const { data: vault1 } = await vaultService.createVault({
        name: `Order Test First ${generateTestId()}`,
        color: '#111111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault1.id);

      await wait(100);

      const { data: vault2 } = await vaultService.createVault({
        name: `Order Test Second ${generateTestId()}`,
        color: '#222222',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault2.id);

      const { data } = await vaultService.getUserVaults(testUser1.id);

      // Find positions of both vaults
      const pos1 = data.findIndex(v => v.id === vault1.id);
      const pos2 = data.findIndex(v => v.id === vault2.id);

      // vault2 (created later) should appear before vault1
      expect(pos2).toBeLessThan(pos1);

      await anonClient.auth.signOut();
    });
  });

  describe('getAccessibleVaults()', () => {
    it('should return vaults user is a member of', async () => {
      const anonClient1 = createAnonClient();
      const anonClient2 = createAnonClient();

      // User1 creates a vault
      await anonClient1.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService1 = new SupabaseVaultService(anonClient1);
      const memberService1 = new SupabaseVaultMemberService(anonClient1);

      const { data: vault } = await vaultService1.createVault({
        name: `Accessible Vault Test ${generateTestId()}`,
        color: '#AABBCC',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Add user2 as member
      await memberService1.addMember(vault.id, testUser2.id, 'member');

      await anonClient1.auth.signOut();

      // User2 checks accessible vaults
      await anonClient2.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService2 = new SupabaseVaultService(anonClient2);
      const { data, error } = await vaultService2.getAccessibleVaults(testUser2.id);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      const foundVault = data.find(v => v.id === vault.id);
      expect(foundVault).toBeDefined();

      await anonClient2.auth.signOut();
    });

    it('should return empty array when user has no memberships', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      // Use fake user ID with no memberships
      const { data, error } = await vaultService.getAccessibleVaults('00000000-0000-0000-0000-000000000000');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);

      await anonClient.auth.signOut();
    });
  });

  describe('updateVault()', () => {
    it('should update vault name', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Update Test Original ${generateTestId()}`,
        color: '#999999',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const newName = `Updated Name ${generateTestId()}`;
      const { data, error } = await vaultService.updateVault(vault.id, { name: newName });

      expect(error).toBeNull();
      expect(data.name).toBe(newName);
      expect(data.color).toBe('#999999'); // unchanged

      await anonClient.auth.signOut();
    });

    it('should update vault color', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Color Update Test ${generateTestId()}`,
        color: '#111111',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const newColor = '#FF0000';
      const { data, error } = await vaultService.updateVault(vault.id, { color: newColor });

      expect(error).toBeNull();
      expect(data.color).toBe(newColor);

      await anonClient.auth.signOut();
    });
  });

  describe('deleteVault()', () => {
    it('should delete a vault', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Delete Test ${generateTestId()}`,
        color: '#FEDCBA',
        owner_id: testUser1.id,
      });

      const { error } = await vaultService.deleteVault(vault.id);

      expect(error).toBeNull();

      // Verify vault is deleted
      const { data: vaults } = await vaultService.getUserVaults(testUser1.id);
      const found = vaults.find(v => v.id === vault.id);
      expect(found).toBeUndefined();

      await anonClient.auth.signOut();
    });
  });

  describe('regenerateInviteCode()', () => {
    it('should generate a new unique invite code', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Invite Code Test ${generateTestId()}`,
        color: '#ABCDEF',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      const originalCode = vault.invite_code;

      const { data: newCode, error } = await vaultService.regenerateInviteCode(vault.id);

      expect(error).toBeNull();
      expect(newCode).toBeDefined();
      expect(newCode.length).toBe(6);
      expect(newCode).not.toBe(originalCode);

      await anonClient.auth.signOut();
    });
  });

  describe('joinVaultByCode()', () => {
    it('should join a vault using invite code', async () => {
      const anonClient1 = createAnonClient();
      const anonClient2 = createAnonClient();

      // User1 creates a vault
      await anonClient1.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService1 = new SupabaseVaultService(anonClient1);

      const { data: vault } = await vaultService1.createVault({
        name: `Join Test ${generateTestId()}`,
        color: '#123ABC',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await anonClient1.auth.signOut();

      // User2 joins using invite code
      await anonClient2.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService2 = new SupabaseVaultService(anonClient2);
      const { data, error } = await vaultService2.joinVaultByCode(vault.invite_code, testUser2.id);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.id).toBe(vault.id);

      // Verify user2 is now a member
      const memberService2 = new SupabaseVaultMemberService(anonClient2);
      const { data: members } = await memberService2.getVaultMembers(vault.id);
      const user2Member = members.find(m => m.user_id === testUser2.id);
      expect(user2Member).toBeDefined();
      expect(user2Member.role).toBe('member');

      await anonClient2.auth.signOut();
    });

    it('should return error for invalid invite code', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data, error } = await vaultService.joinVaultByCode('INVALID', testUser2.id);

      expect(data).toBeNull();
      expect(error).toBeDefined();

      await anonClient.auth.signOut();
    });
  });

  describe('transferOwnership()', () => {
    it('should transfer vault ownership to another user', async () => {
      const anonClient1 = createAnonClient();

      await anonClient1.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient1);
      const memberService = new SupabaseVaultMemberService(anonClient1);

      // Create vault
      const { data: vault } = await vaultService.createVault({
        name: `Transfer Test ${generateTestId()}`,
        color: '#TRANSFER',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      // Add user2 as member first
      await memberService.addMember(vault.id, testUser2.id, 'member');

      // Transfer ownership
      const { error } = await vaultService.transferOwnership(vault.id, testUser2.id);

      expect(error).toBeNull();

      // Verify user2 is now owner
      const { data: members } = await memberService.getVaultMembers(vault.id);
      const user2Member = members.find(m => m.user_id === testUser2.id);
      expect(user2Member).toBeDefined();
      expect(user2Member.role).toBe('owner');

      await anonClient1.auth.signOut();
    });
  });

  describe('leaveVault()', () => {
    it('should allow non-owner member to leave vault', async () => {
      const anonClient1 = createAnonClient();
      const anonClient2 = createAnonClient();

      // User1 creates vault and adds user2
      await anonClient1.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService1 = new SupabaseVaultService(anonClient1);
      const memberService1 = new SupabaseVaultMemberService(anonClient1);

      const { data: vault } = await vaultService1.createVault({
        name: `Leave Test ${generateTestId()}`,
        color: '#LEAVE1',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService1.addMember(vault.id, testUser2.id, 'member');

      await anonClient1.auth.signOut();

      // User2 leaves the vault
      await anonClient2.auth.signInWithPassword({
        email: testUser2Email,
        password: testUserPassword,
      });

      const vaultService2 = new SupabaseVaultService(anonClient2);
      const memberService2 = new SupabaseVaultMemberService(anonClient2);

      const { data: members } = await memberService2.getVaultMembers(vault.id);
      const { error } = await vaultService2.leaveVault(vault.id, testUser2.id, members);

      expect(error).toBeNull();

      // Verify user2 is no longer a member
      const { data: updatedMembers } = await memberService2.getVaultMembers(vault.id);
      const user2Member = updatedMembers.find(m => m.user_id === testUser2.id);
      expect(user2Member).toBeUndefined();

      await anonClient2.auth.signOut();
    });

    it('should prevent owner from leaving when other members exist', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);
      const memberService = new SupabaseVaultMemberService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Owner Leave Test ${generateTestId()}`,
        color: '#LEAVE2',
        owner_id: testUser1.id,
      });
      createdVaultIds.push(vault.id);

      await memberService.addMember(vault.id, testUser2.id, 'member');

      const { data: members } = await memberService.getVaultMembers(vault.id);

      // Add owner as member for the check
      const membersWithOwner = [
        { user_id: testUser1.id, role: 'owner' },
        ...members,
      ];

      const { error } = await vaultService.leaveVault(vault.id, testUser1.id, membersWithOwner);

      expect(error).toBeDefined();
      expect(error.message).toContain('Cannot leave vault as owner');

      await anonClient.auth.signOut();
    });

    it('should delete vault when sole owner leaves', async () => {
      const anonClient = createAnonClient();

      await anonClient.auth.signInWithPassword({
        email: testUser1Email,
        password: testUserPassword,
      });

      const vaultService = new SupabaseVaultService(anonClient);

      const { data: vault } = await vaultService.createVault({
        name: `Sole Owner Leave ${generateTestId()}`,
        color: '#LEAVE3',
        owner_id: testUser1.id,
      });
      // Don't add to createdVaultIds since it will be deleted

      const members = [{ user_id: testUser1.id, role: 'owner' }];

      const { error } = await vaultService.leaveVault(vault.id, testUser1.id, members);

      expect(error).toBeNull();

      // Verify vault is deleted
      const { data: vaults } = await vaultService.getUserVaults(testUser1.id);
      const found = vaults.find(v => v.id === vault.id);
      expect(found).toBeUndefined();

      await anonClient.auth.signOut();
    });
  });

  describe('generateInviteCode()', () => {
    it('should generate 6-character alphanumeric code', () => {
      const anonClient = createAnonClient();
      const vaultService = new SupabaseVaultService(anonClient);

      const code = vaultService.generateInviteCode();

      expect(code.length).toBe(6);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate unique codes', () => {
      const anonClient = createAnonClient();
      const vaultService = new SupabaseVaultService(anonClient);

      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(vaultService.generateInviteCode());
      }

      // All codes should be unique (statistically highly likely)
      expect(codes.size).toBe(100);
    });
  });
});
