import { prisma } from "./prisma";
import { log } from "./logger";

export const AUDIT_ACTIONS = {
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
  TASK_COMPLETED: "TASK_COMPLETED",
  MEMBER_ADDED: "MEMBER_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  MEMBER_LEFT: "MEMBER_LEFT",
  PERMISSION_CHANGED: "PERMISSION_CHANGED",
  INVITE_SENT: "INVITE_SENT",
  INVITE_ACCEPTED: "INVITE_ACCEPTED",
  TEAM_DELETED: "TEAM_DELETED",
  ROUTINE_CREATED: "ROUTINE_CREATED",
  ROUTINE_UPDATED: "ROUTINE_UPDATED",
  ROUTINE_DELETED: "ROUTINE_DELETED",
  NOTE_CREATED: "NOTE_CREATED",
  NOTE_UPDATED: "NOTE_UPDATED",
  NOTE_DELETED: "NOTE_DELETED",
  CONTACT_CREATED: "CONTACT_CREATED",
  CONTACT_UPDATED: "CONTACT_UPDATED",
  CONTACT_DELETED: "CONTACT_DELETED",
  JOURNEY_SECTION_UPDATED: "JOURNEY_SECTION_UPDATED",
  JOURNEY_ENTRY_CREATED: "JOURNEY_ENTRY_CREATED",
  JOURNEY_SNAPSHOT_COMPUTED: "JOURNEY_SNAPSHOT_COMPUTED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface CreateAuditLogParams {
  teamId: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry. Does not throw; logs errors.
 */
export async function createAuditLog(
  params: CreateAuditLogParams,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        teamId: params.teamId,
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (error) {
    log.error(
      { type: "audit_log_error", ...params, error },
      "Failed to create audit log",
    );
  }
}
