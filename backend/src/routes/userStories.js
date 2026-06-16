import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import auditService from '../services/auditService.js';
import { createUserStorySchema, updateUserStorySchema, bulkCreateUserStoriesSchema } from '../lib/schemas.js';
import notificationService from '../services/notificationService.js';

const router = Router();

// GET /api/user-stories
// Fetch all user stories for a product
router.get('/user-stories', authMiddleware, async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: 'Product ID query parameter is required.' });
  }

  try {
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const userStories = await prisma.userStory.findMany({
      where: { productId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json(userStories);
  } catch (error) {
    console.error('[API ERROR] Fetching user stories failed:', error);
    return res.status(500).json({ message: 'Failed to fetch user stories.', details: error.message });
  }
});

// GET /api/user-stories/:id
// Fetch single user story details
router.get('/user-stories/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const userStory = await prisma.userStory.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      }
    });
    if (!userStory) {
      return res.status(404).json({ message: 'User Story not found.' });
    }
    return res.status(200).json(userStory);
  } catch (error) {
    console.error('[API ERROR] Fetching user story failed:', error);
    return res.status(500).json({ message: 'Failed to fetch user story.', details: error.message });
  }
});

// POST /api/user-stories/bulk
// Bulk import user stories (restricted to ADMIN and BOTH roles)
router.post('/user-stories/bulk', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators are authorized to bulk import user stories.' });
  }

  try {
    const validated = bulkCreateUserStoriesSchema.parse(req.body);
    const { productId, stories } = validated;

    // Validate product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Lookup users who are referenced by ownerEmail
    const emails = Array.from(
      new Set(
        stories
          .map(s => s.ownerEmail)
          .filter(Boolean)
          .map(email => email.toLowerCase().trim())
      )
    );

    const dbUsers = await prisma.user.findMany({
      where: { email: { in: emails } }
    });

    const userMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u.id]));

    // Check if any specified email is missing from the database
    const missingEmails = [];
    for (const email of emails) {
      if (!userMap.has(email)) {
        missingEmails.push(email);
      }
    }

    if (missingEmails.length > 0) {
      return res.status(400).json({
        message: `Import failed: The following assigned users are not registered in the system: ${missingEmails.join(', ')}`
      });
    }

    const createdStories = [];
    // Transaction to ensure atomic inserts
    await prisma.$transaction(async (tx) => {
      for (const s of stories) {
        // Fallback to importing Admin's user ID if ownerEmail is not specified/blank
        let ownerId = req.user.id;
        if (s.ownerEmail) {
          const resolvedId = userMap.get(s.ownerEmail.toLowerCase().trim());
          if (resolvedId) {
            ownerId = resolvedId;
          }
        }

        const newStory = await tx.userStory.create({
          data: {
            productId,
            title: s.title.trim(),
            description: (s.description || '').trim() || null,
            status: s.status || 'BACKLOG',
            priority: s.priority || 'LOW',
            storyPoints: s.storyPoints !== undefined && s.storyPoints !== null ? parseInt(s.storyPoints, 10) : 0,
            ownerId,
            sprint: (s.sprint || '').trim() || null
          }
        });

        // Audit Log
        await auditService.createAuditLog({
          userId: req.user.id,
          entityType: 'USER_STORY',
          entityId: newStory.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newStory
        });

        // Notification to owner
        await notificationService.createNotification({
          userId: ownerId,
          title: 'User Story Assigned via Import',
          message: `You have been assigned the user story "${newStory.title}" via bulk import.`,
          type: 'USER_STORY',
          entityId: newStory.id,
          entityType: 'USER_STORY'
        });

        createdStories.push(newStory);
      }
    });

    console.log(`[API] Bulk user stories imported successfully by admin ${req.user.email}. Imported ${createdStories.length} stories.`);
    return res.status(201).json({
      message: `Successfully imported ${createdStories.length} user stories.`,
      stories: createdStories
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-stories
// Create a new user story (restricted to EMPLOYEE only)
router.post('/user-stories', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only employees are authorized to create user stories.' });
  }

  try {
    const validated = createUserStorySchema.parse(req.body);
    const { productId, title, description, status, priority, storyPoints, ownerId, sprint } = validated;

    // Validate product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Validate owner exists and is an employee
    const user = await prisma.user.findUnique({
      where: { id: ownerId }
    });
    if (!user) {
      return res.status(400).json({ message: 'Selected owner user does not exist.' });
    }

    const newUserStory = await prisma.userStory.create({
      data: {
        productId,
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'BACKLOG',
        priority: priority || 'LOW',
        storyPoints: storyPoints !== undefined ? parseInt(storyPoints, 10) : 0,
        ownerId,
        sprint: (sprint || '').trim() || null
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'USER_STORY',
      entityId: newUserStory.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newUserStory
    });

    // Generate Notifications
    // 1. Assigned to user
    await notificationService.createNotification({
      userId: ownerId,
      title: 'User Story Assigned',
      message: `You have been assigned the user story "${newUserStory.title}".`,
      type: 'USER_STORY',
      entityId: newUserStory.id,
      entityType: 'USER_STORY'
    });

    // 2. Critical User Story Alert
    if (priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL User Story Created',
          message: `A critical priority user story "${newUserStory.title}" has been created by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: newUserStory.id,
          entityType: 'USER_STORY'
        });
      }
    }

    console.log(`[API] New User Story US-${newUserStory.id.substring(0, 4)} created by employee ${req.user.email}`);
    return res.status(201).json(newUserStory);
  } catch (error) {
    next(error);
  }
});

// PUT /api/user-stories/:id
// Update a specific user story (restricted to EMPLOYEE only)
router.put('/user-stories/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({
      message: 'Access Denied: Only employees are authorized to update user story details.'
    });
  }

  try {
    const validated = updateUserStorySchema.parse(req.body);
    const { productId, title, description, status, priority, storyPoints, ownerId, sprint } = validated;

    // Check if user story exists
    const existingStory = await prisma.userStory.findUnique({
      where: { id }
    });

    if (!existingStory) {
      return res.status(404).json({ message: 'User Story not found.' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (storyPoints !== undefined) updateData.storyPoints = parseInt(storyPoints, 10);
    if (sprint !== undefined) updateData.sprint = sprint.trim() || null;

    if (productId !== undefined) {
      const productExists = await prisma.product.findUnique({
        where: { id: productId }
      });
      if (!productExists) {
        return res.status(400).json({ message: 'Selected Product does not exist.' });
      }
      updateData.productId = productId;
    }

    if (ownerId !== undefined) {
      // Validate owner exists
      const user = await prisma.user.findUnique({
        where: { id: ownerId }
      });
      if (!user) {
        return res.status(400).json({ message: 'Selected owner user does not exist.' });
      }
      updateData.ownerId = ownerId;
    }

    const updatedStory = await prisma.userStory.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'USER_STORY',
      entityId: updatedStory.id,
      action: 'UPDATE',
      oldValue: existingStory,
      newValue: updatedStory
    });

    // Generate Notifications
    // 1. Status Changed
    if (status !== undefined && status !== existingStory.status) {
      await notificationService.createNotification({
        userId: updatedStory.ownerId,
        title: 'User Story Status Changed',
        message: `User story "${updatedStory.title}" status changed to "${status.replace(/_/g, ' ')}".`,
        type: 'USER_STORY',
        entityId: updatedStory.id,
        entityType: 'USER_STORY'
      });
    }

    // 2. Assigned to user (if owner changed)
    if (ownerId !== undefined && ownerId !== existingStory.ownerId) {
      await notificationService.createNotification({
        userId: ownerId,
        title: 'User Story Assigned',
        message: `You have been assigned the user story "${updatedStory.title}".`,
        type: 'USER_STORY',
        entityId: updatedStory.id,
        entityType: 'USER_STORY'
      });
    }

    // 3. Escalation notification
    if (priority === 'CRITICAL' || existingStory.priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL User Story Alert',
          message: `Critical user story "${updatedStory.title}" has been modified by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: updatedStory.id,
          entityType: 'USER_STORY'
        });
      }
    }

    console.log(`[API] User Story ${id} updated by employee ${req.user.email}`);
    return res.status(200).json(updatedStory);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user-stories/:id
// Delete a specific user story (restricted to EMPLOYEE only)
router.delete('/user-stories/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({
      message: 'Access Denied: Only employees are authorized to delete user stories.'
    });
  }

  try {
    const existingStory = await prisma.userStory.findUnique({
      where: { id }
    });

    if (!existingStory) {
      return res.status(404).json({ message: 'User Story not found.' });
    }

    await prisma.userStory.delete({
      where: { id }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'USER_STORY',
      entityId: id,
      action: 'DELETE',
      oldValue: existingStory,
      newValue: null
    });

    // Notify all admins of critical deletion
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await notificationService.createNotification({
        userId: admin.id,
        title: 'CRITICAL: User Story Deleted',
        message: `User story "${existingStory.title}" was deleted by ${req.user.name}.`,
        type: 'SYSTEM',
        entityId: id,
        entityType: 'USER_STORY'
      });
    }

    console.log(`[API] User Story ${id} deleted by employee ${req.user.email}`);
    return res.status(200).json({ message: 'User Story deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user-stories
// Clear all user stories for a product (restricted to ADMIN/BOTH)
router.delete('/user-stories', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators are authorized to clear user stories.' });
  }

  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: 'Product ID query parameter is required.' });
  }

  try {
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await prisma.userStory.deleteMany({
      where: { productId }
    });

    console.log(`[API] Bulk user stories cleared for product ${productId} by admin ${req.user.email}`);
    return res.status(200).json({ message: 'All user stories cleared successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
