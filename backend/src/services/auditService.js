import prisma from '../lib/prisma.js';

export const auditService = {
  /**
   * Helper to write an audit entry into the database.
   * @param {Object} params
   * @param {string} params.userId - Logged in user ID
   * @param {'STATUS'|'FEATURE'|'USER_STORY'} params.entityType - Type of target entity
   * @param {string} params.entityId - ID of target entity
   * @param {'CREATE'|'UPDATE'|'DELETE'} params.action - Event action
   * @param {Object|null} params.oldValue - Old JSON details
   * @param {Object|null} params.newValue - New JSON details
   */
  async createAuditLog({ userId, entityType, entityId, action, oldValue = null, newValue = null }) {
    try {
      if (!userId) {
        console.warn('[AUDIT LOG WARNING] Cannot create audit log without a userId.');
        return;
      }
      
      await prisma.auditLog.create({
        data: {
          userId,
          entityType,
          entityId,
          action,
          // JSON fields in prisma mysql must be clean JSON objects/arrays
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null
        }
      });
      console.log(`[AUDIT] Recorded ${action} on ${entityType} ${entityId}`);
    } catch (error) {
      console.error('[AUDIT LOG ERROR] Failed to create audit log entry:', error);
    }
  }
};

export default auditService;
