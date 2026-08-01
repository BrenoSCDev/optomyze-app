import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { PrivateAvatarImage } from '@/components/ui/PrivateImage';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import { useOnlinePresence } from '@/contexts/PresenceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserProfile } from '@/services/userApi';
import { User } from '@/types/user';
import optomyzeLogo from '@/assets/user-banner.jpeg';
import ProfileTab from './ProfileTab';
import PerformanceTab from './PerformanceTab';
import ChatTab from './ChatTab';

export type UserProfileTabId = 'profile' | 'performance' | 'chat';

interface UserProfileModalProps {
  userId: number | null;
  initialTab: UserProfileTabId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'manager':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-muted text-foreground border-border';
  }
};

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, initialTab, open, onOpenChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserProfileTabId>(initialTab);
  const { t } = useLanguage();
  const { isUserOnline } = useOnlinePresence();
  const { user: currentUser } = useAuth();
  const backgroundUrl = usePrivateFile(user?.bg_pic);
  const isOwnProfile = !!currentUser && Number(currentUser.id) === userId;

  // Reset to the requested tab whenever the modal is (re)opened for a user.
  // Users can't chat with themselves, so fall back to the Profile tab.
  useEffect(() => {
    if (open) setActiveTab(initialTab === 'chat' && isOwnProfile ? 'profile' : initialTab);
  }, [open, userId, initialTab, isOwnProfile]);

  // Load the user's profile when opened
  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getUserProfile(userId)
      .then(data => { if (!cancelled) setUser(data); })
      .catch(err => console.error('Failed to load user profile:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [open, userId]);

  const online = userId ? isUserOnline(userId) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {isLoading || !user ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Cover image */}
            <div className="relative w-full aspect-[3/1] shrink-0 bg-muted overflow-hidden">
              <img
                src={backgroundUrl || optomyzeLogo}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>

            {/* Avatar + identity */}
            <div className="px-6 -mt-10 relative flex items-end gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                  <PrivateAvatarImage path={user.profile_pic} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background ${online ? 'bg-green-500' : 'bg-gray-400'}`}
                  title={online ? t('users.status.online') : t('users.status.offline')}
                />
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <h2 className="text-lg font-bold text-white py-1 truncate">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`${getRoleColor(user.role)} text-xs capitalize`}>
                    {user.role}
                  </Badge>
                  <span className={`text-xs font-medium ${online ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {online ? t('users.status.online') : t('users.status.offline')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserProfileTabId)} className="px-6 pb-6 pt-4">
              <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <TabsTrigger value="profile">{t('user-profile.tabs.profile')}</TabsTrigger>
                <TabsTrigger value="performance">{t('user-profile.tabs.performance')}</TabsTrigger>
                {!isOwnProfile && <TabsTrigger value="chat">{t('user-profile.tabs.chat')}</TabsTrigger>}
              </TabsList>
              <TabsContent value="profile" className="mt-4">
                <ProfileTab user={user} online={online} />
              </TabsContent>
              <TabsContent value="performance" className="mt-4">
                <PerformanceTab userId={user.id} active={activeTab === 'performance'} />
              </TabsContent>
              {!isOwnProfile && (
                <TabsContent value="chat" className="mt-4">
                  <ChatTab userId={user.id} active={activeTab === 'chat'} />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
