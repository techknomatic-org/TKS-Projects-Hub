import prisma from '../lib/prisma.js';
import { emitToUser } from '../lib/socket.js';
import logger from '../lib/logger.js';

export const notificationService = {
  async createNotification({ userId, title, message, type, entityId = null, entityType = null }) {
    try {
      logger.info(`[NOTIFICATION SERVICE] Creating notification for user ${userId}: "${title}"`);
      
      const newNotification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          entityId,
          entityType
        }
      });

      // Emit to user via socket room in real-time
      emitToUser(userId, 'notification', newNotification);

      return newNotification;
    } catch (error) {
      logger.error('[NOTIFICATION SERVICE ERROR] Failed to create notification:', error);
      throw error;
    }
  }
};

export default notificationService;
