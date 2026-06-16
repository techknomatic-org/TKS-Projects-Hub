import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import auditService from '../services/auditService.js';
import { createStatusSchema, updateStatusSchema } from '../lib/schemas.js';
import notificationService from '../services/notificationService.js';

const router = Router();

// GET /api/products
// Fetch all products
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json(products);
  } catch (error) {
    console.error('[API ERROR] Fetching products failed:', error);
    return res.status(500).json({ message: 'Failed to fetch products.', details: error.message });
  }
});

// GET /api/products/:id
// Fetch single product
router.get('/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error('[API ERROR] Fetching product failed:', error);
    return res.status(500).json({ message: 'Failed to fetch product.', details: error.message });
  }
});

// GET /api/products/:id/status
// Fetch all task statuses for a product
router.get('/products/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const productExists = await prisma.product.findUnique({
      where: { id }
    });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const statuses = await prisma.productStatus.findMany({
      where: { productId: id },
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

    return res.status(200).json(statuses);
  } catch (error) {
    console.error('[API ERROR] Fetching product status failed:', error);
    return res.status(500).json({ message: 'Failed to fetch product status board.', details: error.message });
  }
});

// PUT /api/status/:id
// Update a specific task/status card (restricted to EMPLOYEE only)
router.put('/status/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  // Enforce Admin or Employee permissions
  if (role !== 'ADMIN' && role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ 
      message: 'Access Denied: Unauthorized role.' 
    });
  }

  try {
    const validated = updateStatusSchema.parse(req.body);
    const { title, description, status, priority, ownerId } = validated;

    // Check if task exists
    const existingStatus = await prisma.productStatus.findUnique({
      where: { id }
    });

    if (!existingStatus) {
      return res.status(404).json({ message: 'Task status not found.' });
    }

    // Enforce developer restrictions
    if (role === 'EMPLOYEE') {
      if (existingStatus.status !== 'TODO') {
        return res.status(403).json({ 
          message: 'Access Denied: Developers only have access to modify cards in the To Do column.' 
        });
      }
      if (status !== undefined && status !== 'TODO') {
        return res.status(403).json({ 
          message: 'Access Denied: Developers cannot change status or move cards.' 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

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

    const updatedStatus = await prisma.productStatus.update({
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
      entityType: 'STATUS',
      entityId: updatedStatus.id,
      action: 'UPDATE',
      oldValue: existingStatus,
      newValue: updatedStatus
    });

    // Generate Notifications
    // 1. Status Changed
    if (status !== undefined && status !== existingStatus.status) {
      await notificationService.createNotification({
        userId: updatedStatus.ownerId,
        title: 'Task Status Changed',
        message: `Task "${updatedStatus.title}" status changed from "${existingStatus.status.replace(/_/g, ' ')}" to "${status.replace(/_/g, ' ')}".`,
        type: 'STATUS',
        entityId: updatedStatus.id,
        entityType: 'STATUS'
      });
    }

    // 2. Assigned to user (if owner changed)
    if (ownerId !== undefined && ownerId !== existingStatus.ownerId) {
      await notificationService.createNotification({
        userId: ownerId,
        title: 'Task Assigned',
        message: `You have been assigned the task "${updatedStatus.title}".`,
        type: 'STATUS',
        entityId: updatedStatus.id,
        entityType: 'STATUS'
      });
    }

    // 3. Critical Priority Task Escalation
    if (priority === 'CRITICAL' || existingStatus.priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL Task Updated',
          message: `Critical task "${updatedStatus.title}" has been modified by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: updatedStatus.id,
          entityType: 'STATUS'
        });
      }
    }

    console.log(`[API] Task status ${id} updated by employee ${req.user.email}`);
    return res.status(200).json(updatedStatus);
  } catch (error) {
    next(error);
  }
});

// Fetch all active employees for assigning task owners
router.get('/users', authMiddleware, async (req, res) => {
  const { productId } = req.query;
  try {
    const whereClause = {
      role: { in: ['EMPLOYEE', 'BOTH'] },
      isActive: true
    };

    if (productId) {
      whereClause.taggedProducts = {
        some: { id: productId }
      };
    }

    const employeesList = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(employeesList);
  } catch (error) {
    console.error('[API ERROR] Fetching employees list failed:', error);
    return res.status(500).json({ message: 'Failed to fetch employees list.', details: error.message });
  }
});

// POST /api/status
// Create a new task (restricted to EMPLOYEE only)
router.post('/status', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'EMPLOYEE' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Unauthorized role.' });
  }

  try {
    const validated = createStatusSchema.parse(req.body);
    const { productId, title, description, status, priority, ownerId } = validated;

    if (role === 'EMPLOYEE' && status && status !== 'TODO') {
      return res.status(403).json({ message: 'Access Denied: Developers are only authorized to create cards in the To Do column.' });
    }

    // Validate owner exists and is an employee
    const user = await prisma.user.findUnique({
      where: { id: ownerId }
    });
    if (!user) {
      return res.status(400).json({ message: 'Selected owner user does not exist.' });
    }

    const newTask = await prisma.productStatus.create({
      data: {
        productId,
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'TODO',
        priority: priority || 'LOW',
        ownerId
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
      entityType: 'STATUS',
      entityId: newTask.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newTask
    });

    // Generate Notifications
    // 1. Assigned to user
    await notificationService.createNotification({
      userId: ownerId,
      title: 'Task Assigned',
      message: `You have been assigned the task "${newTask.title}".`,
      type: 'STATUS',
      entityId: newTask.id,
      entityType: 'STATUS'
    });

    // 2. Critical priority notification
    if (priority === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'CRITICAL Task Created',
          message: `A critical priority task "${newTask.title}" has been created by ${req.user.name}.`,
          type: 'SYSTEM',
          entityId: newTask.id,
          entityType: 'STATUS'
        });
      }
    }

    console.log(`[API] New task created by employee ${req.user.email}`);
    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
});

// POST /api/products
// Create a new product (restricted to ADMIN only)
router.post('/products', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only admins are authorized to create products.' });
  }

  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Product name is required.' });
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: (description || '').trim() || null
      }
    });

    console.log(`[API] New product "${newProduct.name}" created by admin ${req.user.email}`);
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('[API ERROR] Creating product failed:', error);
    return res.status(500).json({ message: 'Failed to create product.', details: error.message });
  }
});

// DELETE /api/products/:id
// Delete an existing product (restricted to ADMIN only)
router.delete('/products/:id', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only admins are authorized to delete products.' });
  }

  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await prisma.product.delete({
      where: { id }
    });

    console.log(`[API] Product "${product.name}" deleted by admin ${req.user.email}`);
    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('[API ERROR] Deleting product failed:', error);
    return res.status(500).json({ message: 'Failed to delete product.', details: error.message });
  }
});

export default router;
