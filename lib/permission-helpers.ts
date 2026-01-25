import { AccessLevel } from "@prisma/client";

/**
 * Get default permissions based on access level
 * READ_ONLY users can only view, not create/edit/delete
 * FULL users get all permissions enabled by default
 */
export function getDefaultPermissionsForAccessLevel(
  accessLevel: AccessLevel,
  isAdmin: boolean = false,
): {
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canViewNotes: boolean;
  canCreateNotes: boolean;
  canEditNotes: boolean;
  canDeleteNotes: boolean;
  canViewRoutines: boolean;
  canCreateRoutines: boolean;
  canEditRoutines: boolean;
  canDeleteRoutines: boolean;
  canViewContacts: boolean;
  canCreateContacts: boolean;
  canEditContacts: boolean;
  canDeleteContacts: boolean;
  canViewMoods: boolean;
  canCreateMoods: boolean;
  canViewBurdenScales: boolean;
  canCreateBurdenScales: boolean;
  canViewMembers: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManagePermissions: boolean;
} {
  // Admins always have all permissions
  if (isAdmin) {
    return {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canViewNotes: true,
      canCreateNotes: true,
      canEditNotes: true,
      canDeleteNotes: true,
      canViewRoutines: true,
      canCreateRoutines: true,
      canEditRoutines: true,
      canDeleteRoutines: true,
      canViewContacts: true,
      canCreateContacts: true,
      canEditContacts: true,
      canDeleteContacts: true,
      canViewMoods: true,
      canCreateMoods: true,
      canViewBurdenScales: true,
      canCreateBurdenScales: true,
      canViewMembers: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canManagePermissions: true,
    };
  }

  // READ_ONLY users can only view
  if (accessLevel === "READ_ONLY") {
    return {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canViewNotes: true,
      canCreateNotes: false,
      canEditNotes: false,
      canDeleteNotes: false,
      canViewRoutines: true,
      canCreateRoutines: false,
      canEditRoutines: false,
      canDeleteRoutines: false,
      canViewContacts: true,
      canCreateContacts: false,
      canEditContacts: false,
      canDeleteContacts: false,
      canViewMoods: true,
      canCreateMoods: false,
      canViewBurdenScales: true,
      canCreateBurdenScales: false,
      canViewMembers: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canManagePermissions: false,
    };
  }

  // FULL access users get all permissions enabled by default
  return {
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewNotes: true,
    canCreateNotes: true,
    canEditNotes: true,
    canDeleteNotes: true,
    canViewRoutines: true,
    canCreateRoutines: true,
    canEditRoutines: true,
    canDeleteRoutines: true,
    canViewContacts: true,
    canCreateContacts: true,
    canEditContacts: true,
    canDeleteContacts: true,
    canViewMoods: true,
    canCreateMoods: true,
    canViewBurdenScales: true,
    canCreateBurdenScales: true,
    canViewMembers: true,
    canInviteMembers: false, // Only admins can invite by default
    canRemoveMembers: false, // Only admins can remove by default
    canManagePermissions: false, // Only admins can manage permissions by default
  };
}

/**
 * Enforce READ_ONLY restrictions on permissions
 * If access level is READ_ONLY, ensure create/edit/delete permissions are false
 */
export function enforceReadOnlyRestrictions(
  permissions: Record<string, boolean | undefined>,
  accessLevel: AccessLevel,
  isAdmin: boolean,
): Record<string, boolean | undefined> {
  // Admins are not restricted
  if (isAdmin) {
    return permissions;
  }

  // If READ_ONLY, disable all create/edit/delete permissions
  if (accessLevel === "READ_ONLY") {
    const restricted = { ...permissions };

    // Disable create permissions
    restricted.canCreateTasks = false;
    restricted.canCreateNotes = false;
    restricted.canCreateRoutines = false;
    restricted.canCreateContacts = false;
    restricted.canCreateMoods = false;
    restricted.canCreateBurdenScales = false;

    // Disable edit permissions
    restricted.canEditTasks = false;
    restricted.canEditNotes = false;
    restricted.canEditRoutines = false;
    restricted.canEditContacts = false;

    // Disable delete permissions
    restricted.canDeleteTasks = false;
    restricted.canDeleteNotes = false;
    restricted.canDeleteRoutines = false;
    restricted.canDeleteContacts = false;

    // Disable team management permissions
    restricted.canInviteMembers = false;
    restricted.canRemoveMembers = false;
    restricted.canManagePermissions = false;

    return restricted;
  }

  return permissions;
}
