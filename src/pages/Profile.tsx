import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Camera, Edit, Save, X, Eye, EyeOff, AlertCircle, Upload, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import TopHeader from '@/components/layout/TopHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPhoneNumber } from '@/lib/phone';
import { profileService } from '@/services/profileApi';
import optomyzeLogo from '@/assets/user-banner.jpeg';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleSectionChange = (section: string) => {
    setMobileSidebarOpen(false);
    navigate(`/?section=${section}`);
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile editing state
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Blob URLs for the saved profile/bg pics from private storage
  const savedProfilePicUrl = usePrivateFile(user?.profile_pic);
  const savedBgPicUrl = usePrivateFile(user?.bg_pic);

  // File upload states — local preview overrides the saved URL while editing
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const [bgPicFile, setBgPicFile] = useState<File | null>(null);
  const [bgPicPreview, setBgPicPreview] = useState<string>('');

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
      setProfilePicPreview('');
      setBgPicPreview('');
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
          title: t('profile.no-changes'),
          description: t('profile.no-changes-description'),
        });
        return;
      }

      const response = await profileService.updateProfile(editData, profilePicFile, bgPicFile);
      
      if (response.user) {
        // Update user context with new data
        updateUser(response.user);
        
        toast({
          title: t('profile.updated'),
          description: response.message || t('profile.updated-description'),
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
        setError(t('profile.session-expired'));
      } else if (error.response?.status === 422) {
        // Validation errors from Laravel
        const validationErrors = error.response.data.errors;
        setError(Object.values(validationErrors).flat().join(', '));
      } else if (error.message) {
        // Client-side validation errors
        setError(error.message);
      } else {
        setError(t('profile.update-error'));
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
      errors.currentPassword = t('profile.current-password-required');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('profile.new-password-required');
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = t('profile.password-min-length');
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('profile.passwords-mismatch');
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        setLoading(true);
        
        await profileService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
        
        toast({
          title: t('profile.password-updated'),
          description: t('profile.password-updated-description'),
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
          setPasswordErrors({ currentPassword: t('profile.current-password-incorrect') });
        } else {
          setPasswordErrors({ currentPassword: t('profile.password-update-error') });
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
        setError(t('profile.profile-pic-size-error'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalid-image'));
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
        setError(t('profile.bg-pic-size-error'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalid-image'));
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
    setProfilePicPreview('');
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };

  const handleRemoveBgPic = () => {
    setBgPicFile(null);
    setBgPicPreview('');
    if (bgPicInputRef.current) {
      bgPicInputRef.current.value = '';
    }
  };

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : '?';
  };

  return (
    // Same fixed shell as Index: exactly one viewport tall, with <main> owning
    // the scroll so the document never grows a second scrollbar.
    <div className="h-dvh bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <TopHeader
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        activeSection="profile"
        onSectionChange={handleSectionChange}
      />

      <div className="relative z-10 flex h-full pt-16">
                  <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            activeSection="profile"
            onSectionChange={handleSectionChange}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

        <motion.main
          className="app-scroll flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden transition-colors duration-base ease-standard"
          initial={false}
          animate={{
            marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256)
          }}
        >
          <div>
        {/* Header with background image */}
        <div 
          className="relative h-48 sm:h-64 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${bgPicPreview || savedBgPicUrl || optomyzeLogo})`,
            backgroundColor: 'hsl(var(--muted))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Edit background button */}
          {isEditing && (
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => bgPicInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                {t('profile.change-background')}
              </Button>
              {(bgPicPreview || savedBgPicUrl) && (bgPicPreview || savedBgPicUrl) !== optomyzeLogo && (
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
        <div className="px-4 sm:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile picture + user info - aligned with card */}
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={profilePicPreview || savedProfilePicUrl}
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
                    {(profilePicPreview || savedProfilePicUrl) && (
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
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
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
                  <span>{t('profile.uploading')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Profile details card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('profile.account-info')}</CardTitle>
              </CardHeader>
              <CardContent className={loading ? 'pointer-events-none opacity-50' : ''}>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">{t('profile.profile-details')}</TabsTrigger>
                    <TabsTrigger value="password">{t('profile.password-security')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('profile.full-name')}</Label>
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('profile.phone')}</Label>
                        <Input
                          id="phone"
                          value={isEditing ? editData.phone : formatPhoneNumber(editData.phone)}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                          maxLength={20}
                        />
                      </div>
                    </div>

                    {/* Email display (read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('profile.email')}</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('profile.email-readonly')}
                      </p>
                    </div>

                    {/* Company name display (read-only) */}
                    {user?.company_name && (
                      <div className="space-y-2">
                        <Label htmlFor="company">{t('profile.company')}</Label>
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
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              {uploadProgress > 0 ? `${t('profile.uploading')} ${uploadProgress}%` : t('profile.updating')}
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              {t('profile.save-changes')}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="password" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t('profile.current-password')}</Label>
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
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{t('profile.new-password')}</Label>
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
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('profile.confirm-password')}</Label>
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
                              {t('profile.updating')}
                            </>
                          ) : (
                            t('profile.update-password')
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
        </motion.main>
      </div>
    </div>
  );
};

export default Profile;