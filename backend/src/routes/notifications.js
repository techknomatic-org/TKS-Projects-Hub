import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// GET /api/notifications
// Fetch paginated, filterable notifications for the authenticated user
router.get('/notifications', authMiddleware, async (req, res, next) => {
  const userId = req.user.id;
  const { type, isRead, search, page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const where = { userId };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true';
    }

    if (search && search.trim() !== '') {
      const trimmed = search.trim();
      where.OR = [
        { title: { contains: trimmed } },
        { message: { contains: trimmed } }
      ];
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.notification.count({ where })
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return res.status(200).json({
      notifications,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    logger.error('[API ERROR] Fetching notifications failed:', error);
    next(error);
  }
});

// PATCH /api/notifications/:id/read
// Mark specific notification as read
router.patch('/notifications/:id/read', authMiddleware, async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const existing = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    logger.error(`[API ERROR] Marking notification ${id} as read failed:`, error);
    next(error);
  }
});

// PATCH /api/notifications/read-all
// Mark all notifications of the authenticated user as read
router.patch('/notifications/read-all', authMiddleware, async (req, res, next) => {
  const userId = req.user.id;

  try {
    const updateResult = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.status(200).json({
      success: true,
      message: `Marked all notifications as read.`,
      count: updateResult.count
    });
  } catch (error) {
    logger.error('[API ERROR] Marking all notifications as read failed:', error);
    next(error);
  }
});

export default router;
