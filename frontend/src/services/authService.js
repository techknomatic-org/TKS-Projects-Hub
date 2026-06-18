import { msalInstance } from './msalService.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authService = {
  // Check if a JWT token is expired or close to expiring (within 5 minutes)
  isTokenExpired(token) {
    if (!token) return true;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);
      return Date.now() >= exp * 1000 - 5 * 60 * 1000;
    } catch {
      return true;
    }
  },

  // Silently refresh session using MSAL
  async refreshSessionSilently() {
    try {
      console.log('[AUTH] Attempting silent MSAL token acquisition...');
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No Microsoft accounts logged in.');
      }

      const account = accounts[0];
      // Silently acquire a fresh token from MSAL
      const tokenResult = await msalInstance.acquireTokenSilent({
        scopes: ['user.read', 'openid', 'profile', 'email'],
        account: account
      });

      const idToken = tokenResult.idToken;
      const userEmail = account.username || '';

      console.log('[AUTH] Silently verified with Microsoft. Verifying with TKS server...', userEmail);
      
      // Exchange Microsoft token for a fresh TKS backend JWT
      const data = await this.loginWithMicrosoft(idToken, userEmail);
      
      console.log('[AUTH] Silent session refresh successful.');
      return data.token;
    } catch (error) {
      console.error('[AUTH] Silent session refresh failed:', error);
      this.logout();
      throw error;
    }
  },

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
    sessionStorage.clear();
    // Clear any MSAL items in localStorage just in case cacheLocation is changed in the future
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('msal.')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Check if user has active session and token is not expired
  isAuthenticated() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
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
