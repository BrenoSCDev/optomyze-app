import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Camera, Edit, Save, X, Eye, EyeOff, AlertCircle, Upload, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { profileService } from '@/services/profileApi';
import optomyzeLogo from '@/assets/optomyze.png';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile editing state
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // File upload states
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState(user?.profile_pic ? `http://localhost/${user.profile_pic}` : '');
  const [bgPicFile, setBgPicFile] = useState<File | null>(null);
  const [bgPicPreview, setBgPicPreview] = useState(user?.bg_pic ? `http://localhost/${user.bg_pic}` : '');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Password reset state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // File input refs
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bgPicInputRef = useRef<HTMLInputElement>(null);

  // Update form data when user context changes
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
      });
      setProfilePicPreview(user.profile_pic ? `http://localhost/${user.profile_pic}` : '');
      setBgPicPreview(user.bg_pic ? `http://localhost/${user.bg_pic}` : '');
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data if canceling
      setEditData({
        name: user?.name || '',
        phone: user?.phone || '',
      });
      setProfilePicFile(null);
      setBgPicFile(null);
      setProfilePicPreview(user?.profile_pic ? `http://localhost/${user.profile_pic}` : '');
      setBgPicPreview(user?.bg_pic ? `http://localhost/${user.bg_pic}` : '');
      setError(null);
      
      // Reset file inputs
      if (profilePicInputRef.current) profilePicInputRef.current.value = '';
      if (bgPicInputRef.current) bgPicInputRef.current.value = '';
    }
    setIsEditing(!isEditing);
  };

  const validateForm = () => {
    const errors = [];
    
    // Name validation
    if (editData.name && editData.name.length > 255) {
      errors.push('Name must be less than 255 characters');
    }
    
    // Phone validation
    if (editData.phone && editData.phone.length > 20) {
      errors.push('Phone number must be less than 20 characters');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Check if any field has changed
      const hasTextChanges = editData.name !== user?.name || editData.phone !== user?.phone;
      const hasFileChanges = profilePicFile || bgPicFile;
      
      if (!hasTextChanges && !hasFileChanges) {
        toast({
          title: "No Changes",
          description: "No changes to save.",
        });
        return;
      }

      const response = await profileService.updateProfile(editData, profilePicFile, bgPicFile);
      
      if (response.user) {
        // Update user context with new data
        updateUser(response.user);
        
        toast({
          title: "Profile Updated",
          description: response.message || "Your profile has been successfully updated.",
        });
        
        // Reset form states
        setProfilePicFile(null);
        setBgPicFile(null);
        setIsEditing(false);
        
        // Reset file inputs
        if (profilePicInputRef.current) profilePicInputRef.current.value = '';
        if (bgPicInputRef.current) bgPicInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 422) {
        // Validation errors from Laravel
        const validationErrors = error.response.data.errors;
        setError(Object.values(validationErrors).flat().join(', '));
      } else if (error.message) {
        // Client-side validation errors
        setError(error.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePasswordReset = async () => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        setLoading(true);
        
        await profileService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
        
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setPasswordErrors({});
        
      } catch (error: any) {
        if (error.response?.status === 422) {
          const validationErrors = error.response.data.errors;
          const errorMessage = Object.values(validationErrors).flat().join(', ');
          setPasswordErrors({ currentPassword: errorMessage });
        } else if (error.response?.status === 400) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          setPasswordErrors({ currentPassword: 'Failed to update password. Please try again.' });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // File upload handlers
  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file immediately
      if (file.size > 2048 * 1024) {
        setError('Profile picture must be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Clear any existing errors
      setError(null);
      
      // Set file and create preview
      setProfilePicFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePicPreview(previewUrl);
    }
  };

  const handleBgPicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file immediately
      if (file.size > 4096 * 1024) {
        setError('Background picture must be less than 4MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Clear any existing errors
      setError(null);
      
      // Set file and create preview
      setBgPicFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setBgPicPreview(previewUrl);
    }
  };

  const handleRemoveProfilePic = () => {
    setProfilePicFile(null);
    setProfilePicPreview(user?.profile_pic ? `http://localhost/${user.profile_pic}` : '');
    
    // Reset file input
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };

  const handleRemoveBgPic = () => {
    setBgPicFile(null);
    setBgPicPreview(user?.bg_pic ? `http://localhost/${user.bg_pic}` : '');
    
    // Reset file input
    if (bgPicInputRef.current) {
      bgPicInputRef.current.value = '';
    }
  };

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar 
        isCollapsed={false}
        onToggle={() => {}}
        activeSection="profile"
        onSectionChange={() => {}}
      />
      
      <div className="lg:pl-64">
        {/* Header with background image */}
        <div 
          className="relative h-64 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${bgPicPreview || optomyzeLogo})`,
            backgroundColor: 'hsl(var(--muted))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Profile picture positioned at bottom of header */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={profilePicPreview} 
                  alt="Profile"
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold text-white">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    className="rounded-full w-8 h-8 p-0"
                    onClick={() => profilePicInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  {profilePicPreview && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={handleRemoveProfilePic}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit background button */}
          {isEditing && (
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => bgPicInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Change Background
              </Button>
              {bgPicPreview && bgPicPreview !== optomyzeLogo && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveBgPic}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={profilePicInputRef}
            onChange={handleProfilePicChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={bgPicInputRef}
            onChange={handleBgPicChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Main content */}
        <div className="px-8 pt-20 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* User info header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{user?.name}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {user?.company_name && (
                    <Badge variant="secondary" className="mt-2">
                      {user.company_name}
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={handleEditToggle}
                  variant={isEditing ? "outline" : "default"}
                  className="ml-4"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Error display */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload progress */}
            {loading && uploadProgress > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Profile details card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className={loading ? 'pointer-events-none opacity-50' : ''}>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Profile Details</TabsTrigger>
                    <TabsTrigger value="password">Password & Security</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                          maxLength={20}
                        />
                      </div>
                    </div>

                    {/* Email display (read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    {/* Company name display (read-only) */}
                    {user?.company_name && (
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={user.company_name}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex justify-end space-x-4 pt-4">
                        <Button variant="outline" onClick={handleEditToggle} disabled={loading}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Updating...'}
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="password" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className={passwordErrors.currentPassword ? "border-destructive" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className={passwordErrors.newPassword ? "border-destructive" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button onClick={handlePasswordReset} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;