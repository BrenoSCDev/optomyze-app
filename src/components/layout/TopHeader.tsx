/**
 * TOP HEADER COMPONENT
 * 
 * A fixed top header with:
 * - Left: Logo/App name
 * - Center: Global search bar
 * - Right: Notification bell + User menu
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStorageUrl } from '@/lib/constants';
import optomyzeLogo from '@/assets/optomyze.png';

interface TopHeaderProps {
  sidebarCollapsed: boolean;
}

const TopHeader = ({ sidebarCollapsed }: TopHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Mock unread count - will be replaced with real data later
  const unreadNotifications = 3;

  return (
    <motion.header
      className="fixed top-0 right-0 z-40 h-16 glass-card border-b border-white/10 flex items-center justify-between px-6"
      initial={false}
      animate={{ 
        left: sidebarCollapsed ? 64 : 256,
        width: sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 256px)'
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Section - Logo (hidden on mobile, shown when sidebar is collapsed) */}
      <div className="flex items-center gap-4">
        <AnimatePresence>
          {sidebarCollapsed && (
            <motion.img
              src={optomyzeLogo}
              alt="Optomyze"
              className="h-6 hidden md:block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 flex justify-center max-w-xl mx-4">
        {/* Desktop Search */}
        <div className="hidden md:flex relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('header.search-placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>

        {/* Mobile Search - Icon that expands */}
        <div className="md:hidden">
          <AnimatePresence>
            {searchExpanded ? (
              <motion.div
                className="flex items-center gap-2"
                initial={{ width: 40 }}
                animate={{ width: 200 }}
                exit={{ width: 40 }}
              >
                <Input
                  type="text"
                  placeholder={t('header.search-placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/50 border-white/10"
                  autoFocus
                  onBlur={() => !searchQuery && setSearchExpanded(false)}
                />
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchExpanded(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Section - Notifications + User Menu */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Button>

        {/* User Menu */}
        {user && (
          <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-primary/10"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.profile_pic ? (
                    <img
                      src={getStorageUrl(user.profile_pic)}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-white/20">
                      <span className="text-primary font-semibold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name - hidden on mobile */}
                <span className="hidden lg:block text-sm font-medium text-foreground max-w-24 truncate">
                  {user.name}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 hidden sm:block ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 glass-card backdrop-blur-md bg-background/95 border border-white/20"
              sideOffset={8}
            >
              <DropdownMenuItem className="cursor-pointer hover:bg-white hover:text-black">
                <Link to="/profile" className="flex items-center w-full">
                  <UserCircle className="h-4 w-4 mr-2" />
                  {t('header.my-profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-white hover:text-black"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>
  );
};

export default TopHeader;
