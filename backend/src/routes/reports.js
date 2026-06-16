import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// GET /api/reports/status-distribution
// Kanban tasks status distribution
router.get('/reports/status-distribution', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const where = {};
    if (productId) {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    const tasks = await prisma.productStatus.findMany({ where });

    const distribution = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      TESTING: 0,
      BLOCKED: 0,
      READY_FOR_RELEASE: 0,
      DONE: 0
    };

    tasks.forEach((task) => {
      if (distribution[task.status] !== undefined) {
        distribution[task.status]++;
      }
    });

    // Format for pie chart
    const data = Object.keys(distribution).map((key) => ({
      name: key.replace(/_/g, ' '),
      value: distribution[key]
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error('[REPORTS ERROR] status distribution failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve status distribution.', details: error.message });
  }
});

// GET /api/reports/feature-overview
// Feature statuses counts
router.get('/reports/feature-overview', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const where = {};
    if (productId) {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    const features = await prisma.feature.findMany({ where });

    const counts = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      ON_HOLD: 0
    };

    features.forEach((f) => {
      if (counts[f.status] !== undefined) {
        counts[f.status]++;
      }
    });

    const data = Object.keys(counts).map((key) => ({
      name: key.replace(/_/g, ' '),
      value: counts[key]
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error('[REPORTS ERROR] feature overview failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve feature overview.', details: error.message });
  }
});

// GET /api/reports/story-overview
// User story statuses counts
router.get('/reports/story-overview', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const where = {};
    if (productId) {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    const stories = await prisma.userStory.findMany({ where });

    const counts = {
      BACKLOG: 0,
      READY: 0,
      IN_PROGRESS: 0,
      TESTING: 0,
      DONE: 0
    };

    stories.forEach((s) => {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });

    const data = Object.keys(counts).map((key) => ({
      name: key.replace(/_/g, ' '),
      value: counts[key]
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error('[REPORTS ERROR] story overview failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve user story overview.', details: error.message });
  }
});

// GET /api/reports/sprint-velocity
// Completed story points per sprint
router.get('/reports/sprint-velocity', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const where = {
      status: 'DONE',
      sprint: { not: null }
    };
    if (productId) {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    const stories = await prisma.userStory.findMany({ where });

    const sprintPoints = {};

    stories.forEach((s) => {
      const sp = s.sprint.trim();
      sprintPoints[sp] = (sprintPoints[sp] || 0) + s.storyPoints;
    });

    // Format into line chart sorted by sprint name
    const data = Object.keys(sprintPoints)
      .sort()
      .map((key) => ({
        sprint: key,
        points: sprintPoints[key]
      }));

    return res.status(200).json(data);
  } catch (error) {
    console.error('[REPORTS ERROR] sprint velocity failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve sprint velocity.', details: error.message });
  }
});

// GET /api/reports/workload
// Count of tasks, features, stories per developer
router.get('/reports/workload', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const dateQuery = startDate || endDate ? {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? (() => {
          const d = new Date(endDate);
          d.setHours(23, 59, 59, 999);
          return d;
        })() : undefined
      }
    } : {};

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: {
        name: true,
        productStatuses: {
          where: {
            productId: productId || undefined,
            ...dateQuery
          }
        },
        features: {
          where: {
            productId: productId || undefined,
            ...dateQuery
          }
        },
        userStories: {
          where: {
            productId: productId || undefined,
            ...dateQuery
          }
        }
      }
    });

    const workloadData = employees.map((emp) => ({
      name: emp.name,
      tasks: emp.productStatuses.length,
      features: emp.features.length,
      stories: emp.userStories.length
    }));

    return res.status(200).json(workloadData);
  } catch (error) {
    console.error('[REPORTS ERROR] employee workload failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve employee workload.', details: error.message });
  }
});

// GET /api/reports/release-readiness
// Completed features / Total features ratio percentage per product
router.get('/reports/release-readiness', authMiddleware, async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  try {
    const where = productId ? { id: productId } : {};
    
    const products = await prisma.product.findMany({
      where,
      include: {
        features: {
          where: startDate || endDate ? {
            createdAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? (() => {
                const d = new Date(endDate);
                d.setHours(23, 59, 59, 999);
                return d;
              })() : undefined
            }
          } : {}
        }
      }
    });

    const readinessData = products.map((prod) => {
      const total = prod.features.length;
      const completed = prod.features.filter((f) => f.status === 'COMPLETED').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        id: prod.id,
        productName: prod.name,
        totalFeatures: total,
        completedFeatures: completed,
        percentage
      };
    });

    return res.status(200).json(readinessData);
  } catch (error) {
    console.error('[REPORTS ERROR] release readiness failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve release readiness data.', details: error.message });
  }
});

export default router;
