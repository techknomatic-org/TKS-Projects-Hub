import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';
import auditService from '../services/auditService.js';
import {
  createMappingSchema,
  updateMappingSchema,
  createFunctionalRequirementSchema
} from '../lib/schemas.js';

const router = Router();

// GET /api/requirements-mapping
// Fetch flattened user story mappings with filtering & search
router.get('/requirements-mapping', authMiddleware, async (req, res) => {
  const { projectId, sprintId, status, search } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: 'Product ID query parameter is required.' });
  }

  try {
    // 1. Fetch all project user stories to calculate a stable sequential ID (US-001, US-002, etc.)
    const allStories = await prisma.userStory.findMany({
      where: {
        productId: projectId
      },
      orderBy: { createdAt: 'asc' }
    });

    const storyDisplayIdMap = {};
    allStories.forEach((story, idx) => {
      storyDisplayIdMap[story.id] = `US-${String(idx + 1).padStart(3, '0')}`;
    });

    // 2. Fetch stories filtered by sprint if requested
    const whereClause = {
      productId: projectId
    };

    if (sprintId) {
      whereClause.sprint = sprintId;
    }

    const stories = await prisma.userStory.findMany({
      where: whereClause,
      include: {
        requirementMappings: {
          include: {
            functionalRequirement: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });


    // 3. Flatten relationships into spreadsheet-like rows
    let rows = [];
    stories.forEach((story) => {
      const displayId = storyDisplayIdMap[story.id] || 'US-000';

      if (story.requirementMappings && story.requirementMappings.length > 0) {
        story.requirementMappings.forEach((mapping) => {
          rows.push({
            id: mapping.id,
            userStoryId: story.id,
            userStoryDisplayId: displayId,
            userStoryTitle: story.title,
            userStoryDescription: story.description,
            userStorySprint: story.sprint,
            functionalRequirementId: mapping.functionalRequirement.id,
            functionalRequirementReqId: mapping.functionalRequirement.reqId,
            functionalRequirementTitle: mapping.functionalRequirement.title,
            functionalRequirementDescription: mapping.functionalRequirement.description,
            status: 'Mapped',
            createdAt: mapping.createdAt
          });
        });
      } else {
        rows.push({
          id: null,
          userStoryId: story.id,
          userStoryDisplayId: displayId,
          userStoryTitle: story.title,
          userStoryDescription: story.description,
          userStorySprint: story.sprint,
          functionalRequirementId: null,
          functionalRequirementReqId: '-',
          functionalRequirementTitle: 'Not Mapped Yet',
          functionalRequirementDescription: null,
          status: 'Pending',
          createdAt: story.createdAt
        });
      }
    });

    // 4. Apply status filtering
    if (status && status !== 'All') {
      rows = rows.filter(row => row.status.toLowerCase() === status.toLowerCase());
    }

    // 5. Apply search filtering (searches User Story ID/Title, or Functional Requirement ID/Title)
    if (search) {
      const searchLower = search.toLowerCase();
      rows = rows.filter((row) => {
        return (
          row.userStoryDisplayId.toLowerCase().includes(searchLower) ||
          row.userStoryTitle.toLowerCase().includes(searchLower) ||
          (row.userStoryDescription && row.userStoryDescription.toLowerCase().includes(searchLower)) ||
          row.functionalRequirementReqId.toLowerCase().includes(searchLower) ||
          row.functionalRequirementTitle.toLowerCase().includes(searchLower)
        );
      });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error('[API ERROR] Fetching requirements mapping failed:', error);
    return res.status(500).json({ message: 'Failed to fetch requirements mapping.', details: error.message });
  }
});

// GET /api/requirements-mapping/:id
// Get single mapping record details
router.get('/requirements-mapping/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const mapping = await prisma.userStoryRequirementMapping.findUnique({
      where: { id },
      include: {
        userStory: true,
        functionalRequirement: true
      }
    });

    if (!mapping) {
      return res.status(404).json({ message: 'Mapping not found.' });
    }

    return res.status(200).json(mapping);
  } catch (error) {
    console.error('[API ERROR] Fetching mapping details failed:', error);
    return res.status(500).json({ message: 'Failed to fetch mapping details.', details: error.message });
  }
});

// POST /api/requirements-mapping
// Create a new requirements mapping (Admins/Managers only)
router.post('/requirements-mapping', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only Admins/Managers are authorized to create requirements mappings.' });
  }

  try {
    const validated = createMappingSchema.parse(req.body);
    const { userStoryId, functionalRequirementId } = validated;

    // Check if user story exists
    const story = await prisma.userStory.findUnique({ where: { id: userStoryId } });
    if (!story) {
      return res.status(404).json({ message: 'User Story not found.' });
    }

    // Check if functional requirement exists
    const requirement = await prisma.functionalRequirement.findUnique({ where: { id: functionalRequirementId } });
    if (!requirement) {
      return res.status(404).json({ message: 'Functional Requirement not found.' });
    }

    // Check for duplicate mapping
    const existing = await prisma.userStoryRequirementMapping.findUnique({
      where: {
        userStoryId_functionalRequirementId: {
          userStoryId,
          functionalRequirementId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'This mapping relation already exists.' });
    }

    const newMapping = await prisma.userStoryRequirementMapping.create({
      data: {
        userStoryId,
        functionalRequirementId
      },
      include: {
        userStory: true,
        functionalRequirement: true
      }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'REQUIREMENTS_MAPPING',
      entityId: newMapping.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newMapping
    });

    console.log(`[API] Requirements mapping created successfully for User Story ${userStoryId} -> FR ${functionalRequirementId}`);
    return res.status(201).json(newMapping);
  } catch (error) {
    next(error);
  }
});

// PUT /api/requirements-mapping/:id
// Update an existing mapping (Admins/Managers only)
router.put('/requirements-mapping/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only Admins/Managers are authorized to update requirements mappings.' });
  }

  try {
    const validated = updateMappingSchema.parse(req.body);
    const { userStoryId, functionalRequirementId } = validated;

    const existingMapping = await prisma.userStoryRequirementMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return res.status(404).json({ message: 'Requirements mapping not found.' });
    }

    const updateData = {};
    if (userStoryId) {
      const story = await prisma.userStory.findUnique({ where: { id: userStoryId } });
      if (!story) return res.status(404).json({ message: 'User Story not found.' });
      updateData.userStoryId = userStoryId;
    }

    if (functionalRequirementId) {
      const requirement = await prisma.functionalRequirement.findUnique({ where: { id: functionalRequirementId } });
      if (!requirement) return res.status(404).json({ message: 'Functional Requirement not found.' });
      updateData.functionalRequirementId = functionalRequirementId;
    }

    // Check if new relation forms a duplicate with another mapping record
    if (userStoryId || functionalRequirementId) {
      const targetUserStoryId = userStoryId || existingMapping.userStoryId;
      const targetFRId = functionalRequirementId || existingMapping.functionalRequirementId;

      if (targetUserStoryId !== existingMapping.userStoryId || targetFRId !== existingMapping.functionalRequirementId) {
        const duplicate = await prisma.userStoryRequirementMapping.findUnique({
          where: {
            userStoryId_functionalRequirementId: {
              userStoryId: targetUserStoryId,
              functionalRequirementId: targetFRId
            }
          }
        });
        if (duplicate) {
          return res.status(400).json({ message: 'This mapping relation already exists on another record.' });
        }
      }
    }

    const updatedMapping = await prisma.userStoryRequirementMapping.update({
      where: { id },
      data: updateData,
      include: {
        userStory: true,
        functionalRequirement: true
      }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'REQUIREMENTS_MAPPING',
      entityId: id,
      action: 'UPDATE',
      oldValue: existingMapping,
      newValue: updatedMapping
    });

    return res.status(200).json(updatedMapping);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/requirements-mapping/:id
// Delete a specific requirements mapping relation (Admins/Managers only)
router.delete('/requirements-mapping/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only Admins/Managers are authorized to delete requirements mappings.' });
  }

  try {
    const existingMapping = await prisma.userStoryRequirementMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return res.status(404).json({ message: 'Requirements mapping not found.' });
    }

    await prisma.userStoryRequirementMapping.delete({
      where: { id }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'REQUIREMENTS_MAPPING',
      entityId: id,
      action: 'DELETE',
      oldValue: existingMapping,
      newValue: null
    });

    console.log(`[API] Requirements mapping ${id} deleted successfully by admin ${req.user.email}`);
    return res.status(200).json({ message: 'Requirements mapping deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/functional-requirements
// Fetch all functional requirements for a product
router.get('/functional-requirements', authMiddleware, async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: 'Product ID query parameter is required.' });
  }

  try {
    const requirements = await prisma.functionalRequirement.findMany({
      where: { productId },
      orderBy: { reqId: 'asc' }
    });
    return res.status(200).json(requirements);
  } catch (error) {
    console.error('[API ERROR] Fetching functional requirements failed:', error);
    return res.status(500).json({ message: 'Failed to fetch functional requirements.', details: error.message });
  }
});

// POST /api/functional-requirements
// Create a new functional requirement for a product (Admins/Managers only)
router.post('/functional-requirements', authMiddleware, async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'ADMIN' && role !== 'BOTH') {
    return res.status(403).json({ message: 'Access Denied: Only Admins/Managers are authorized to create functional requirements.' });
  }

  try {
    const validated = createFunctionalRequirementSchema.parse(req.body);
    const { productId, reqId, title, description } = validated;

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check for duplicate reqId in this product
    const existing = await prisma.functionalRequirement.findFirst({
      where: { productId, reqId: reqId.trim() }
    });

    if (existing) {
      return res.status(400).json({ message: `Functional Requirement ID "${reqId}" already exists for this project.` });
    }

    const newReq = await prisma.functionalRequirement.create({
      data: {
        productId,
        reqId: reqId.trim(),
        title: title.trim(),
        description: (description || '').trim()
      }
    });

    await auditService.createAuditLog({
      userId: req.user.id,
      entityType: 'FUNCTIONAL_REQUIREMENT',
      entityId: newReq.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newReq
    });

    console.log(`[API] Functional requirement ${reqId} created successfully for product ${productId}`);
    return res.status(201).json(newReq);
  } catch (error) {
    next(error);
  }
});

export default router;
