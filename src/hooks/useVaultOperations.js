/**
 * Custom hook for vault CRUD operations
 */

import { useCallback } from 'react';
import { handleError, VaultError } from '../utils/errors';
import { validateVaultName, validateInviteCode, assertValid } from '../utils/validation';

export function useVaultOperations(services, currentUser) {
  const { vault, vaultMember, storage } = services;

  /**
   * Create a new vault
   */
  const createVault = useCallback(async (name, coverImage = null) => {
    try {
      if (!currentUser) {
        throw new VaultError('Must be logged in to create a vault');
      }

      // Validate vault name
      const nameValidation = validateVaultName(name);
      assertValid(nameValidation, 'Vault name validation');

      // Create vault
      const { data: newVault, error } = await vault.createVault({
        name: nameValidation.value,
        owner_id: currentUser.id
      });

      if (error) {
        throw new VaultError(error.message || 'Failed to create vault', error);
      }

      // Add creator as owner in vault_members
      if (newVault) {
        const { error: memberError } = await vaultMember.addMember(
          newVault.id,
          currentUser.id,
          'owner'
        );

        if (memberError) {
          console.error('Error adding owner to vault_members:', memberError);
        }
      }

      return { data: newVault, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault, vaultMember, currentUser]);

  /**
   * Update vault details
   */
  const updateVault = useCallback(async (vaultId, updates) => {
    try {
      // Validate name if it's being updated
      if (updates.name) {
        const nameValidation = validateVaultName(updates.name);
        assertValid(nameValidation, 'Vault name validation');
        updates.name = nameValidation.value;
      }

      const { error } = await vault.updateVault(vaultId, updates);

      if (error) {
        throw new VaultError(error.message || 'Failed to update vault', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault]);

  /**
   * Delete a vault
   */
  const deleteVault = useCallback(async (vaultId) => {
    try {
      const { error } = await vault.deleteVault(vaultId);

      if (error) {
        throw new VaultError(error.message || 'Failed to delete vault', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault]);

  /**
   * Get vault members with user info
   */
  const getVaultMembers = useCallback(async (vaultId) => {
    try {
      const { data, error } = await vaultMember.getVaultMembers(vaultId);

      if (error) {
        throw new VaultError(error.message || 'Failed to fetch members', error);
      }

      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vaultMember]);

  /**
   * Regenerate vault invite code
   */
  const regenerateInviteCode = useCallback(async (vaultId) => {
    try {
      const { data: newCode, error } = await vault.regenerateInviteCode(vaultId);

      if (error) {
        throw new VaultError(error.message || 'Failed to regenerate invite code', error);
      }

      return { data: newCode, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault]);

  /**
   * Join vault by invite code
   */
  const joinVaultByCode = useCallback(async (code) => {
    try {
      if (!currentUser) {
        throw new VaultError('You must be logged in to join a vault');
      }

      // Validate invite code
      const codeValidation = validateInviteCode(code);
      assertValid(codeValidation, 'Invite code validation');

      const normalizedCode = codeValidation.value.toUpperCase();

      const { data: vaultData, error } = await vault.joinVaultByCode(normalizedCode, currentUser.id);

      if (error) {
        throw new VaultError(error.message || 'Invalid invite code. Please check and try again.', error);
      }

      return { data: vaultData, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault, currentUser]);

  /**
   * Update member role
   */
  const updateMemberRole = useCallback(async (memberId, role) => {
    try {
      const { error } = await vaultMember.updateMemberRole(memberId, role);

      if (error) {
        throw new VaultError(error.message || 'Failed to update member role', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vaultMember]);

  /**
   * Remove member from vault
   */
  const removeMember = useCallback(async (memberId) => {
    try {
      const { error } = await vaultMember.removeMember(memberId);

      if (error) {
        throw new VaultError(error.message || 'Failed to remove member', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vaultMember]);

  /**
   * Transfer vault ownership
   */
  const transferOwnership = useCallback(async (vaultId, newOwnerUserId) => {
    try {
      if (!currentUser) {
        throw new VaultError('Must be logged in to transfer ownership');
      }

      const { error } = await vault.transferOwnership(vaultId, newOwnerUserId);

      if (error) {
        throw new VaultError(error.message || 'Failed to transfer ownership', error);
      }

      return { error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault, currentUser]);

  /**
   * Leave vault
   */
  const leaveVault = useCallback(async (vaultId, members) => {
    try {
      if (!currentUser) {
        throw new VaultError('Must be logged in to leave a vault');
      }

      const { error } = await vault.leaveVault(vaultId, currentUser.id, members);

      if (error) {
        throw new VaultError(error.message || 'Failed to leave vault', error);
      }

      const currentMember = members.find(m => m.user_id === currentUser.id);
      const isOwner = currentMember?.role === 'owner';

      return { error: null, data: { transferred: isOwner } };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault, currentUser]);

  /**
   * Upload vault cover image
   */
  const uploadVaultCover = useCallback(async (vaultId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vaultId}-${Date.now()}.${fileExt}`;
      const filePath = `vault-covers/${fileName}`;

      const { error: uploadError } = await storage.uploadFile('covers', filePath, file);

      if (uploadError) {
        throw new VaultError(uploadError.message || 'Failed to upload cover image', uploadError);
      }

      const publicUrl = storage.getPublicUrl('covers', filePath);

      return { data: publicUrl, error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [storage]);

  /**
   * Get accessible vaults for current user
   */
  const getAccessibleVaults = useCallback(async () => {
    try {
      if (!currentUser) {
        return { data: [], error: null };
      }

      const { data, error } = await vault.getAccessibleVaults(currentUser.id);

      if (error) {
        throw new VaultError(error.message || 'Failed to fetch vaults', error);
      }

      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error, { logError: true });
    }
  }, [vault, currentUser]);

  return {
    createVault,
    updateVault,
    deleteVault,
    getVaultMembers,
    regenerateInviteCode,
    joinVaultByCode,
    updateMemberRole,
    removeMember,
    transferOwnership,
    leaveVault,
    uploadVaultCover,
    getAccessibleVaults
  };
}
