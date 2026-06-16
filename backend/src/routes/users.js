import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import { createUserSchema, updateUserSchema } from '../lib/schemas.js';

const router = Router();

router.get('/users/all', authMiddleware, async (req, res) => {
  try {
    const usersList = await prisma.user.findMany({
      include: {
        taggedProducts: {
          select: { id: true }
        },
        productStatuses: {
          select: { productId: true }
        },
        features: {
          select: { productId: true }
        },
        userStories: {
          select: {
            productId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    const sanitized = usersList.map(u => {
      // Gather all unique project/product IDs this user is assigned to
      const productIds = new Set();
      
      if (u.productStatuses) {
        u.productStatuses.forEach(s => productIds.add(s.productId));
      }
      if (u.features) {
        u.features.forEach(f => productIds.add(f.productId));
      }
      if (u.userStories) {
        u.userStories.forEach(us => {
          if (us.productId) {
            productIds.add(us.productId);
          }
        });
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profileImage: u.profileImage,
        isActive: u.isActive,
        createdAt: u.createdAt,
        taggedProductIds: u.taggedProducts ? u.taggedProducts.map(p => p.id) : [],
        assignedProductIds: Array.from(productIds)
      };
    });

    return res.status(200).json(sanitized);
  } catch (error) {
    console.error('[API ERROR] Fetching all users failed:', error);
    return res.status(500).json({ message: 'Failed to fetch members list.', details: error.message });
  }
});

// POST /api/users/all
// Pre-approve/add a new developer/admin
// Restricted to ADMIN only
router.post('/users/all', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators can add new members.' });
  }

  try {
    const validated = createUserSchema.parse(req.body);
    const { name, email, role: targetRole, taggedProductIds } = validated;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: targetRole,
        isActive: true,
        ...((targetRole === 'EMPLOYEE' || targetRole === 'BOTH') && taggedProductIds && taggedProductIds.length > 0 && {
          taggedProducts: {
            connect: taggedProductIds.map(id => ({ id }))
          }
        })
      },
      include: {
        taggedProducts: {
          select: { id: true }
        }
      }
    });

    console.log(`[API] New user pre-approved: ${newUser.email} with role ${newUser.role} by admin ${req.user.email}`);
    
    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      profileImage: newUser.profileImage,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      taggedProductIds: newUser.taggedProducts ? newUser.taggedProducts.map(p => p.id) : [],
      assignedProductIds: []
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/all/:id
// Update user details (name, email, role, isActive status)
router.put('/users/all/:id', authMiddleware, async (req, res, next) => {
  const { role, id: currentUserId } = req.user;
  const isUpdatingOnlyPhoto = Object.keys(req.body).length === 1 && req.body.profileImage !== undefined;

  if (role !== 'ADMIN' && role !== 'BOTH' && !isUpdatingOnlyPhoto) {
    return res.status(403).json({ message: 'Access Denied: Only administrators can update member details.' });
  }

  const { id } = req.params;

  try {
    const validated = updateUserSchema.parse(req.body);
    const { name, email, role: targetRole, isActive, taggedProductIds, profileImage } = validated;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Safety check: Prevent changing one's own role or active status (only applicable when not just updating photo)
    if (!isUpdatingOnlyPhoto && id === currentUserId) {
      if (isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own account.' });
      }
      if (targetRole && targetRole === 'EMPLOYEE') {
        return res.status(400).json({ message: 'You cannot demote yourself from the Administrator role.' });
      }
    }

    if (!isUpdatingOnlyPhoto && email && email.toLowerCase().trim() !== existingUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
      if (emailTaken) {
        return res.status(400).json({ message: 'A user with this email address already exists.' });
      }
    }

    const finalRole = targetRole !== undefined ? targetRole : existingUser.role;

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(targetRole !== undefined && { role: targetRole }),
      ...(isActive !== undefined && { isActive }),
      ...(profileImage !== undefined && { profileImage })
    };

    if (finalRole === 'ADMIN') {
      updateData.taggedProducts = {
        set: []
      };
    } else if (taggedProductIds !== undefined) {
      updateData.taggedProducts = {
        set: taggedProductIds.map(id => ({ id }))
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        taggedProducts: {
          select: { id: true }
        },
        productStatuses: {
          select: { productId: true }
        },
        features: {
          select: { productId: true }
        },
        userStories: {
          select: {
            productId: true
          }
        }
      }
    });

    console.log(`[API] User updated: ${updatedUser.email} (Role: ${updatedUser.role}, Active: ${updatedUser.isActive}) by admin ${req.user.email}`);
    
    const productIds = new Set();
    if (updatedUser.productStatuses) {
      updatedUser.productStatuses.forEach(s => productIds.add(s.productId));
    }
    if (updatedUser.features) {
      updatedUser.features.forEach(f => productIds.add(f.productId));
    }
    if (updatedUser.userStories) {
      updatedUser.userStories.forEach(us => {
        if (us.productId) {
          productIds.add(us.productId);
        }
      });
    }

    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      taggedProductIds: updatedUser.taggedProducts ? updatedUser.taggedProducts.map(p => p.id) : [],
      assignedProductIds: Array.from(productIds)
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/all/:id
// Delete a pre-approved user
// Restricted to ADMIN only
router.delete('/users/all/:id', authMiddleware, async (req, res, next) => {
  const { role, id: currentUserId } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only administrators can delete members.' });
  }

  const { id } = req.params;

  if (id === currentUserId) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Clean up all user's associated items and then delete the user
    await prisma.$transaction([
      prisma.auditLog.deleteMany({
        where: { userId: id }
      }),
      prisma.userStory.deleteMany({
        where: { ownerId: id }
      }),
      prisma.feature.deleteMany({
        where: { ownerId: id }
      }),
      prisma.productStatus.deleteMany({
        where: { ownerId: id }
      }),
      prisma.user.delete({
        where: { id }
      })
    ]);

    console.log(`[API] User permanently deleted along with all associated items: ${existingUser.email} by admin ${req.user.email}`);
    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('[API ERROR] Deleting user failed:', error);
    return res.status(500).json({ message: 'Failed to delete user.', details: error.message });
  }
});

export default router;
