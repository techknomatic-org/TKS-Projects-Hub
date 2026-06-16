const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authService = {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('tks_token');
  },

  // Get user info from localStorage
  getUser() {
    const userStr = localStorage.getItem('tks_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Store token and user details
  setSession(token, user) {
    localStorage.setItem('tks_token', token);
    localStorage.setItem('tks_user', JSON.stringify(user));
  },

  // Clear session data
  logout() {
    localStorage.removeItem('tks_token');
    localStorage.removeItem('tks_user');
  },

  // Check if user has active session
  isAuthenticated() {
    return !!this.getToken();
  },

  // Authenticate with backend using Microsoft ID Token or a developer mock email
  async loginWithMicrosoft(idToken, bypassEmail = null, profileImage = null) {
    try {
      const response = await fetch(`${API_URL}/auth/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          email: bypassEmail,
          profileImage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token && data.user) {
        this.setSession(data.token, data.user);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get authenticated user info from backend
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        this.logout();
        return null;
      }

      this.setSession(token, data.user);
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  }
};
