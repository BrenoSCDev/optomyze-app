import api from './api';

export const authService = {
  // Login function
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      
      const { access_token, user, funnels } = response.data;
      
      // Store in localStorage
      localStorage.setItem('optomyze_auth_token', access_token);
      localStorage.setItem('optomyze_user', JSON.stringify(user));
      localStorage.setItem('optomyze_funnels', JSON.stringify(funnels));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout function
  logout() {
    localStorage.removeItem('optomyze_auth_token');
    localStorage.removeItem('optomyze_user');
    localStorage.removeItem('optomyze_funnels');
  },

  // Get stored auth data
  getAuthData() {
    const token = localStorage.getItem('optomyze_auth_token');
    const user = localStorage.getItem('optomyze_user');
    const funnels = localStorage.getItem('optomyze_funnels');

    return {
      token,
      user: user ? JSON.parse(user) : null,
      funnels: funnels ? JSON.parse(funnels) : [],
    };
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('optomyze_auth_token');
    return !!token;
  },
};