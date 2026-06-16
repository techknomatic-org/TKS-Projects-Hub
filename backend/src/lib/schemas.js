import { z } from 'zod';

const StatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'BLOCKED', 'READY_FOR_RELEASE', 'DONE']);
const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const FeatureStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']);
const StoryStatusEnum = z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'TESTING', 'DONE']);

export const createStatusSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID')
});

export const updateStatusSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional()
});

export const createFeatureSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: FeatureStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID'),
  releaseVersion: z.string().optional().nullable()
});

export const updateFeatureSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  status: FeatureStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
  releaseVersion: z.string().optional().nullable()
});

export const bulkCreateFeaturesSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  features: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    status: FeatureStatusEnum.optional().nullable(),
    priority: PriorityEnum.optional().nullable(),
    ownerEmail: z.string().email('Invalid owner email address').optional().nullable(),
    releaseVersion: z.string().optional().nullable()
  })).min(1, 'At least one feature is required')
});

export const createUserStorySchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: StoryStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  storyPoints: z.coerce.number().int().min(0, 'Story points must be non-negative').optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID'),
  sprint: z.string().optional().nullable()
});

export const updateUserStorySchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID').optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  status: StoryStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  storyPoints: z.coerce.number().int().min(0, 'Story points must be non-negative').optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
  sprint: z.string().optional().nullable()
});

export const createMappingSchema = z.object({
  userStoryId: z.string().uuid('User Story ID must be a valid UUID'),
  functionalRequirementId: z.string().uuid('Functional Requirement ID must be a valid UUID')
});

export const updateMappingSchema = z.object({
  userStoryId: z.string().uuid('User Story ID must be a valid UUID').optional(),
  functionalRequirementId: z.string().uuid('Functional Requirement ID must be a valid UUID').optional()
});

export const createFunctionalRequirementSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  reqId: z.string().min(1, 'Requirement ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable()
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'BOTH']),
  taggedProductIds: z.array(z.string().uuid('Product ID must be a valid UUID')).optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'BOTH']).optional(),
  isActive: z.boolean().optional(),
  taggedProductIds: z.array(z.string().uuid('Product ID must be a valid UUID')).optional(),
  profileImage: z.string().optional().nullable()
});

export const bulkCreateUserStoriesSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  stories: z.array(z.object({
    title: z.string().min(1, 'User Story Title is required'),
    description: z.string().optional().nullable(),
    status: StoryStatusEnum.optional().nullable(),
    priority: PriorityEnum.optional().nullable(),
    storyPoints: z.coerce.number().int().min(0, 'Story points must be non-negative').optional().nullable(),
    ownerEmail: z.string().email('Invalid owner email address').optional().nullable(),
    sprint: z.string().optional().nullable()
  })).min(1, 'At least one user story is required')
});


