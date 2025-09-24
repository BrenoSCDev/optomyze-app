import api from './api';

export const profileService = {
  // Update user profile with text fields and file uploads
  async updateProfile(formData, profilePicFile, bgPicFile) {
    // Create FormData for multipart request
    const form = new FormData();

    // Add text fields (only if they have values)
    if (formData.name && formData.name.trim()) {
      form.append('name', formData.name.trim());
    }
    
    if (formData.phone && formData.phone.trim()) {
      form.append('phone', formData.phone.trim());
    }

    // Add file uploads (only if files are selected)
    if (profilePicFile) {
      // Validate file size (2MB max)
      if (profilePicFile.size > 2048 * 1024) {
        throw new Error('Profile picture must be less than 2MB');
      }
      
      // Validate file type
      if (!profilePicFile.type.startsWith('image/')) {
        throw new Error('Profile picture must be an image file');
      }
      
      form.append('profile_pic', profilePicFile);
    }

    if (bgPicFile) {
      // Validate file size (4MB max)
      if (bgPicFile.size > 4096 * 1024) {
        throw new Error('Background picture must be less than 4MB');
      }
      
      // Validate file type
      if (!bgPicFile.type.startsWith('image/')) {
        throw new Error('Background picture must be an image file');
      }
      
      form.append('bg_pic', bgPicFile);
    }

    // Make API request with proper headers for file upload
    const response = await api.post('/api/auth/update', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data;
  },

  // Update password
  async updatePassword(currentPassword, newPassword) {
    const response = await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    });

    return response.data;
  }
};