import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import auditService from '../services/auditService.js';
import { createFeatureSchema, updateFeatureSchema, bulkCreateFeaturesSchema } from '../lib/schemas.js';
import notificationService from '../services/notificationService.js';

const router = Router();

// GET /api/features
// Fetch all features for a product
router.get('/features', authMiddleware, async (req, res) => {
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

    const features = await prisma.feature.findMany({
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

    return res.status(200).json(features);
  } catch (error) {
    console.error('[API ERROR] Fetching features failed:', error);
    return res.status(500).json({ message: 'Failed to fetch features.', details: error.message });
  }
});

// GET /api/features/:id
// Fetch single feature
router.get('/features/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const feature = await prisma.feature.findUnique({
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
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found.' });
    }
    return res.status(200).json(feature);
  } catch (error) {
    console.error('[API ERROR] Fetching feature failed:', error);
    return res.status(500).json({ message: 'Failed to fetch feature.', details: error.message });
  }
});

// POST /api/features/bulk
// Bulk import features (restricted to ADMIN only)
router.post('/features/bulk', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators are authorized to bulk import features.' });
  }

  try {
    const validated = bulkCreateFeaturesSchema.parse(req.body);
    const { productId, features } = validated;

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
        features
          .map(f => f.ownerEmail)
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

    const createdFeatures = [];
    // Transaction to ensure atomic inserts
    await prisma.$transaction(async (tx) => {
      for (const f of features) {
        // Fallback to importing Admin's user ID if ownerEmail is not specified/blank
        let ownerId = req.user.id;
        if (f.ownerEmail) {
          const resolvedId = userMap.get(f.ownerEmail.toLowerCase().trim());
          if (resolvedId) {
            ownerId = resolvedId;
          }
        }

        const newFeature = await tx.feature.create({
          data: {
            productId,
            title: f.title.trim(),
            description: (f.description || '').trim() || null,
            status: f.status || 'PLANNED',
            priority: f.priority || 'LOW',
            ownerId,
            releaseVersion: (f.releaseVersion || '').trim() || null
          }
        });

        // Audit Log
        await auditService.createAuditLog({
          userId: req.user.id,
          entityType: 'FEATURE',
          entityId: newFeature.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newFeature
        });

        // Notification to owner
        await notificationService.createNotification({
          userId: ownerId,
          title: 'Feature Assigned via Import',
          message: `You have been assigned the feature "${newFeature.title}" via bulk import.`,
          type: 'FEATURE',
          entityId: newFeature.id,
          entityType: 'FEATURE'
        });

        createdFeatures.push(newFeature);
      }
    });

    console.log(`[API] Bulk features imported successfully by admin ${req.user.email}. Imported ${createdFeatures.length} features.`);
    return res.status(201).json({
      message: `Successfully imported ${createdFeatures.length} features.`,
      features: createdFeatures
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/features
// Create a new feature (restricted to EMPLOYEE only)
router.post('/features', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only employees are authorized to create features.' });
  }

  try {
    const validated = createFeatureSchema.parse(req.body);
    const { productId, title, description, status, priority, ownerId, releaseVersion } = validated;

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

    const newFeature = await prisma.feature.create({
      data: {
        productId,
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'PLANNED',
        priority: priority || 'LOW',
        ownerId,
        releaseVersion: (releaseVersion || '').trim() || null
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
      entityType: 'FEATURE',
      entityId: newFeature.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newFeature
    });

    // Generate Notifications
    // 1. Created Notification (to owner)
    await notificationService.createNotification({
      userId: ownerId,
      title: 'Feature Assigned',
      message: `You have been assigned the new feature "${newFeature.title}".`,
      type: 'FEATURE',
      entityId: newFeature.id,
      entityType: 'FEATURE'
    });

    // 2. Critical priority feature alert
    if (priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL Feature Created',
          message: `A critical priority feature "${newFeature.title}" has been created by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: newFeature.id,
          entityType: 'FEATURE'
        });
      }
    }

    console.log(`[API] New feature created by employee ${req.user.email}`);
    return res.status(201).json(newFeature);
  } catch (error) {
    next(error);
  }
});

// PUT /api/features/:id
// Update a specific feature (restricted to EMPLOYEE only)
router.put('/features/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ 
      message: 'Access Denied: Only employees are authorized to update feature details.' 
    });
  }

  try {
    const validated = updateFeatureSchema.parse(req.body);
    const { title, description, status, priority, ownerId, releaseVersion } = validated;

    // Check if feature exists
    const existingFeature = await prisma.feature.findUnique({
      where: { id }
    });

    if (!existingFeature) {
      return res.status(404).json({ message: 'Feature not found.' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (releaseVersion !== undefined) updateData.releaseVersion = releaseVersion.trim() || null;

    if (ownerId !== undefined) {
      // Validate owner exists and is an employee
      const user = await prisma.user.findUnique({
        where: { id: ownerId }
      });
      if (!user) {
        return res.status(400).json({ message: 'Selected owner user does not exist.' });
      }
      updateData.ownerId = ownerId;
    }

    const updatedFeature = await prisma.feature.update({
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
      entityType: 'FEATURE',
      entityId: updatedFeature.id,
      action: 'UPDATE',
      oldValue: existingFeature,
      newValue: updatedFeature
    });

    // Generate Notifications
    // 1. Assigned to user (if owner changed)
    if (ownerId !== undefined && ownerId !== existingFeature.ownerId) {
      await notificationService.createNotification({
        userId: ownerId,
        title: 'Feature Assigned',
        message: `You have been assigned the feature "${updatedFeature.title}".`,
        type: 'FEATURE',
        entityId: updatedFeature.id,
        entityType: 'FEATURE'
      });
    }

    // 2. Updated notification to owner
    await notificationService.createNotification({
      userId: updatedFeature.ownerId,
      title: 'Feature Updated',
      message: `Feature "${updatedFeature.title}" has been updated.`,
      type: 'FEATURE',
      entityId: updatedFeature.id,
      entityType: 'FEATURE'
    });

    // 3. Release Readiness (100% check)
    if (status === 'COMPLETED' && existingFeature.status !== 'COMPLETED') {
      const allFeatures = await prisma.feature.findMany({
        where: { productId: existingFeature.productId }
      });
      const incomplete = allFeatures.filter(f => f.id !== existingFeature.id && f.status !== 'COMPLETED');
      if (incomplete.length === 0) {
        const product = await prisma.product.findUnique({ where: { id: existingFeature.productId } });
        const allUsers = await prisma.user.findMany({ where: { isActive: true } });
        for (const u of allUsers) {
          await notificationService.createNotification({
            userId: u.id,
            title: 'Release Ready: 100%',
            message: `Product "${product.name}" has reached 100% feature readiness!`,
            type: 'RELEASE',
            entityId: product.id,
            entityType: 'FEATURE'
          });
        }
      }
    }

    // 4. Critical priority feature escalation
    if (priority === 'CRITICAL' || existingFeature.priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL Feature Alert',
          message: `Critical priority feature "${updatedFeature.title}" has been modified by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: updatedFeature.id,
          entityType: 'FEATURE'
        });
      }
    }

    console.log(`[API] Feature ${id} updated by employee ${req.user.email}`);
    return res.status(200).json(updatedFeature);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/features/:id
// Delete a specific feature (restricted to EMPLOYEE only)
router.delete('/features/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ 
      message: 'Access Denied: Only employees are authorized to delete features.' 
    });
  }

  try {
    const existingFeature = await prisma.feature.findUnique({
      where: { id }
    });

    if (!existingFeature) {
      return res.status(404).json({ message: 'Feature not found.' });
    }

    await prisma.feature.delete({
      where: { id }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'FEATURE',
      entityId: id,
      action: 'DELETE',
      oldValue: existingFeature,
      newValue: null
    });

    // Critical Audit notification: Notify all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await notificationService.createNotification({
        userId: admin.id,
        title: 'CRITICAL: Feature Deleted',
        message: `Feature "${existingFeature.title}" was deleted by ${req.user.name}.`,
        type: 'SYSTEM',
        entityId: id,
        entityType: 'FEATURE'
      });
    }

    console.log(`[API] Feature ${id} deleted by employee ${req.user.email}`);
    return res.status(200).json({ message: 'Feature deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/features
// Clear all features for a product (restricted to ADMIN/BOTH)
router.delete('/features', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators are authorized to clear features.' });
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

    // Delete all features for the product
    await prisma.feature.deleteMany({
      where: { productId }
    });

    console.log(`[API] All features for product ${productId} cleared successfully by admin ${req.user.email}`);
    return res.status(200).json({ message: 'All features cleared successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
