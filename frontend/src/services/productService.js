import { authService } from './authService.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shadowed fetch function to intercept all API requests and handle silent JWT refresh seamlessly
const fetch = async (url, options = {}) => {
  let token = authService.getToken();

  // 1. Pre-flight expiry check
  if (token && authService.isTokenExpired(token)) {
    console.log('[API] Shadow fetch: Token is expired or expiring. Refreshing silently...');
    try {
      token = await authService.refreshSessionSilently();
      if (options.headers) {
        if (typeof options.headers.set === 'function') {
          options.headers.set('Authorization', `Bearer ${token}`);
        } else {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error('[API] Shadow fetch pre-flight refresh failed. Redirecting to login.');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  // 2. Perform the actual fetch request
  let response = await window.fetch(url, options);

  // 3. Post-flight 401 check (if token expired on server or was rejected)
  if (response.status === 401) {
    console.warn('[API] Shadow fetch: Request returned 401. Retrying with refreshed token...');
    try {
      token = await authService.refreshSessionSilently();
      if (options.headers) {
        if (typeof options.headers.set === 'function') {
          options.headers.set('Authorization', `Bearer ${token}`);
        } else {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      // Update Authorization header in options for retry
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
      
      response = await window.fetch(url, { ...options, headers: retryHeaders });
    } catch (err) {
      console.error('[API] Shadow fetch retry failed. Redirecting to login.');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return response;
};

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const productService = {
  // Fetch all products
  async getProducts() {
    const response = await fetch(`${API_URL}/products`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch products');
    }
    return response.json();
  },

  // Create a new product (Employees only)
  async createProduct(productData) {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }
    return data;
  },

  // Delete an existing product (Employees only)
  async deleteProduct(productId) {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete product');
    }
    return data;
  },

  // Fetch a single product detail
  async getProduct(productId) {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch product details');
    }
    return response.json();
  },

  // Fetch status tasks for a product
  async getProductStatuses(productId) {
    const response = await fetch(`${API_URL}/products/${productId}/status`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch status board');
    }
    return response.json();
  },

  // Update status card column or details (Employees only)
  async updateStatusCard(id, updateData) {
    const response = await fetch(`${API_URL}/status/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update task status');
    }
    return data;
  },

  // Fetch whitelisted employees list for assigning task owners
  async getEmployees(productId = '') {
    let url = `${API_URL}/users`;
    if (productId) {
      url += `?productId=${productId}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch employees list');
    }
    return response.json();
  },

  // Create a new status task card (Employees only)
  async createStatusCard(taskData) {
    const response = await fetch(`${API_URL}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create task card');
    }
    return data;
  },

  // Fetch features for a product
  async getFeatures(productId) {
    const response = await fetch(`${API_URL}/features?productId=${productId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch features');
    }
    return response.json();
  },

  // Create a new feature (Employees only)
  async createFeature(featureData) {
    const response = await fetch(`${API_URL}/features`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(featureData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create feature');
    }
    return data;
  },

  // Bulk import features (Admins only)
  async importFeaturesBulk(productId, features) {
    const response = await fetch(`${API_URL}/features/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, features })
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        const errorDetails = data.errors.map(e => {
          const parts = e.field.split('.');
          if (parts[0] === 'features' && !isNaN(parts[1])) {
            const rowNum = parseInt(parts[1], 10) + 1;
            const fieldName = parts[2] ? parts[2].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : '';
            return `Row ${rowNum}: ${fieldName} - ${e.message}`;
          }
          return `${e.field}: ${e.message}`;
        }).join('\n');
        throw new Error(`Import failed: Validation errors:\n${errorDetails}`);
      }
      throw new Error(data.message || 'Failed to import features');
    }
    return data;
  },

  // Update a feature (Employees only)
  async updateFeature(featureId, featureData) {
    const response = await fetch(`${API_URL}/features/${featureId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(featureData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update feature');
    }
    return data;
  },

  // Delete a feature (Employees only)
  async deleteFeature(featureId) {
    const response = await fetch(`${API_URL}/features/${featureId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete feature');
    }
  },

  // Clear all features for a product (Admins only)
  async clearFeatures(productId) {
    const response = await fetch(`${API_URL}/features?productId=${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to clear features list');
    }
    return data;
  },

  // Fetch user stories for a product
  async getUserStories(productId) {
    let url = `${API_URL}/user-stories?productId=${productId}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch user stories');
    }
    return response.json();
  },

  // Create a new user story (Employees only)
  async createUserStory(storyData) {
    const response = await fetch(`${API_URL}/user-stories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create user story');
    }
    return data;
  },

  // Update user story details (Employees only)
  async updateUserStory(storyId, storyData) {
    const response = await fetch(`${API_URL}/user-stories/${storyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user story');
    }
    return data;
  },

  // Delete a user story (Employees only)
  async deleteUserStory(storyId) {
    const response = await fetch(`${API_URL}/user-stories/${storyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user story');
    }
    return data;
  },

  // Bulk import user stories (Admins only)
  async importUserStoriesBulk(productId, stories) {
    const response = await fetch(`${API_URL}/user-stories/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, stories })
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        const errorDetails = data.errors.map(e => {
          const parts = e.field.split('.');
          if (parts[0] === 'stories' && !isNaN(parts[1])) {
            const rowNum = parseInt(parts[1], 10) + 1;
            const fieldName = parts[2] ? parts[2].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : '';
            return `Row ${rowNum}: ${fieldName} - ${e.message}`;
          }
          return `${e.field}: ${e.message}`;
        }).join('\n');
        throw new Error(`Import failed: Validation errors:\n${errorDetails}`);
      }
      throw new Error(data.message || 'Failed to import user stories');
    }
    return data;
  },

  // Clear all user stories for a product (Admins only)
  async clearUserStories(productId) {
    const response = await fetch(`${API_URL}/user-stories?productId=${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to clear user stories list');
    }
    return data;
  },

  // Retrieve audit logs
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/audit-logs?${query}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch audit logs');
    }
    return response.json();
  },

  // Retrieve details for a specific log
  async getAuditLogDetails(id) {
    const response = await fetch(`${API_URL}/audit-logs/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch audit log details');
    }
    return response.json();
  },

  // Generic helper for report data fetches
  async getReportData(endpoint, productId, startDate = '', endDate = '') {
    let url = `${API_URL}/reports/${endpoint}?`;
    if (productId) url += `productId=${productId}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Failed to fetch report data for ${endpoint}`);
    }
    return response.json();
  },

  getReportStatusDistribution(productId, startDate, endDate) {
    return this.getReportData('status-distribution', productId, startDate, endDate);
  },
  getReportFeatureOverview(productId, startDate, endDate) {
    return this.getReportData('feature-overview', productId, startDate, endDate);
  },
  getReportStoryOverview(productId, startDate, endDate) {
    return this.getReportData('story-overview', productId, startDate, endDate);
  },
  getReportSprintVelocity(productId, startDate, endDate) {
    return this.getReportData('sprint-velocity', productId, startDate, endDate);
  },
  getReportWorkload(productId, startDate, endDate) {
    return this.getReportData('workload', productId, startDate, endDate);
  },
  getReportReleaseReadiness(productId, startDate, endDate) {
    return this.getReportData('release-readiness', productId, startDate, endDate);
  },

  // Fetch paginated, filterable user notifications
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/notifications?${query}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch notifications');
    }
    return response.json();
  },

  // Mark notification as read
  async markNotificationAsRead(id) {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark notification as read');
    }
    return data;
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }
    return data;
  },

  // Fetch requirements mappings with filters
  async getRequirementsMappings(projectId, filters = {}) {
    const { sprintId, status, search } = filters;
    const params = new URLSearchParams({ projectId });
    if (sprintId) params.append('sprintId', sprintId);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/requirements-mapping?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch requirements mappings');
    }
    return response.json();
  },

  // Create a new mapping relation (Admins only)
  async createRequirementsMapping(mappingData) {
    const response = await fetch(`${API_URL}/requirements-mapping`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(mappingData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create requirements mapping');
    }
    return data;
  },

  // Update a mapping relation (Admins only)
  async updateRequirementsMapping(id, mappingData) {
    const response = await fetch(`${API_URL}/requirements-mapping/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(mappingData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update requirements mapping');
    }
    return data;
  },

  // Delete a mapping relation (Admins only)
  async deleteRequirementsMapping(id) {
    const response = await fetch(`${API_URL}/requirements-mapping/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete requirements mapping');
    }
    return data;
  },

  // Fetch functional requirements
  async getFunctionalRequirements(productId) {
    const response = await fetch(`${API_URL}/functional-requirements?productId=${productId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch functional requirements');
    }
    return response.json();
  },

  // Create a functional requirement (Admins only)
  async createFunctionalRequirement(requirementData) {
    const response = await fetch(`${API_URL}/functional-requirements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requirementData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create functional requirement');
    }
    return data;
  },

  // Fetch all users (Admins + Employees, active + inactive)
  async getAllUsers() {
    const response = await fetch(`${API_URL}/users/all`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch all users list');
    }
    return response.json();
  },

  // Create/Pre-approve a new user (Admins only)
  async createUser(userData) {
    const response = await fetch(`${API_URL}/users/all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create user');
    }
    return data;
  },

  // Update a user (Admins only)
  async updateUser(userId, userData) {
    const response = await fetch(`${API_URL}/users/all/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user');
    }
    return data;
  },

  // Delete/Remove a user (Admins only)
  async deleteUser(userId) {
    const response = await fetch(`${API_URL}/users/all/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user');
    }
    return data;
  }
};
export default productService;

