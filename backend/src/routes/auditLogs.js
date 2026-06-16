import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// GET /api/audit-logs
// Retrieve all audit logs with combined filters
router.get('/audit-logs', authMiddleware, async (req, res) => {
  const { userId, entityType, action, search, startDate, endDate } = req.query;

  try {
    const where = {};

    if (userId) {
      where.userId = userId;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      where.OR = [
        { entityId: { contains: trimmedSearch } },
        {
          user: {
            name: { contains: trimmedSearch }
          }
        }
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(auditLogs);
  } catch (error) {
    console.error('[API ERROR] Fetching audit logs failed:', error);
    return res.status(500).json({ message: 'Failed to fetch audit logs.', details: error.message });
  }
});

// GET /api/audit-logs/:id
// Retrieve details for a specific log
router.get('/audit-logs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ message: 'Audit log entry not found.' });
    }

    return res.status(200).json(log);
  } catch (error) {
    console.error('[API ERROR] Fetching audit log details failed:', error);
    return res.status(500).json({ message: 'Failed to fetch audit log details.', details: error.message });
  }
});

export default router;
