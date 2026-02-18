/**
 * TOP HEADER COMPONENT
 * 
 * A fixed top header with:
 * - Left: Logo/App name
 * - Center: Global search bar with lead quick search
 * - Right: Notification bell + User menu
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, LogOut, UserCircle, ChevronDown, Loader2, Check } from 'lucide-react';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getStorageUrl } from '@/lib/constants';
import { searchLeads, LeadSearchResult } from '@/services/leadSearchApi';
import optomyzeLogo from '@/assets/optomyze.png';
import { getEcho } from '@/services/echo';

interface TopHeaderProps {
  sidebarCollapsed: boolean;
}

const TopHeader = ({ sidebarCollapsed }: TopHeaderProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchResults, setSearchResults] = useState<LeadSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLeads(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  // Handle lead selection - open preview modal
  const handleLeadSelect = (lead: LeadSearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedLeadId(String(lead.id));
    setIsLeadModalOpen(true);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setSearchQuery('');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) {
      console.log('🔌 Echo not initialized, skipping connection status binding');
      return;
    }

    const connector = echo.connector as { pusher?: { connection?: { bind: (event: string, callback: () => void) => void; unbind: (event: string, callback: () => void) => void } } };
    
    const handleConnected = () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    };
    
    const handleDisconnected = () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    };

    connector.pusher?.connection?.bind('connected', handleConnected);
    connector.pusher?.connection?.bind('disconnected', handleDisconnected);

    return () => {
      connector.pusher?.connection?.unbind('connected', handleConnected);
      connector.pusher?.connection?.unbind('disconnected', handleDisconnected);
    };
  }, []);

  // Handle notification click - open preview modal
  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markAsRead(notif.id);
    setNotificationDropdownOpen(false);
    setSelectedLeadId(String(notif.lead.id));
    setIsLeadModalOpen(true);
  };

  // Format notification timestamp
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('header.time.just-now');
    if (diffMins < 60) return t('header.time.minutes-ago').replace('{count}', String(diffMins));
    if (diffHours < 24) return t('header.time.hours-ago').replace('{count}', String(diffHours));
    if (diffDays < 7) return t('header.time.days-ago').replace('{count}', String(diffDays));
    return date.toLocaleDateString();
  };

  return (
    <>
    <motion.header
      className="fixed top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 rounded-none"
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
        <div ref={searchContainerRef} className="hidden md:flex relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <Input
            type="text"
            placeholder={t('header.search-placeholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.length >= 3 && searchResults.length > 0 && setShowResults(true)}
            className="w-full pl-10 pr-10 bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
          />
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
              >
                {searchResults.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleLeadSelect(lead)}
                    className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {lead.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {lead.first_name} {lead.last_name}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results message */}
          <AnimatePresence>
            {showResults && searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/20 rounded-lg shadow-xl z-50 p-4"
              >
                <p className="text-sm text-muted-foreground text-center">
                  {t('header.no-results')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Search - Icon that expands */}
        <div className="md:hidden relative" ref={!searchContainerRef.current ? searchContainerRef : undefined}>
          <AnimatePresence>
            {searchExpanded ? (
              <motion.div
                className="flex items-center gap-2 relative"
                initial={{ width: 40 }}
                animate={{ width: 200 }}
                exit={{ width: 40 }}
              >
                <Input
                  type="text"
                  placeholder={t('header.search-placeholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-background/50 border-white/10"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setSearchExpanded(false);
                  }}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
                
                {/* Mobile Search Results */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => handleLeadSelect(lead)}
                        className="w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-foreground truncate block">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
        {/* Notification Bell with Dropdown */}
        <DropdownMenu open={notificationDropdownOpen} onOpenChange={setNotificationDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 glass-card backdrop-blur-md bg-background/95 border border-white/20 max-h-96 overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">
                {t('header.notifications') || 'Notifications'}
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary/80"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('header.mark-all-read') || 'Mark all read'}
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {t('header.no-notifications') || 'No notifications yet'}
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`px-3 py-3 cursor-pointer focus:bg-primary/10 ${
                      !notif.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Unread indicator */}
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notif.read ? 'bg-transparent' : 'bg-primary'
                      }`} />
                      
                      {/* Creator avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {notif.creator.profile_pic ? (
                          <img
                            src={getStorageUrl(notif.creator.profile_pic)}
                            alt={notif.creator.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary font-semibold text-xs">
                            {notif.creator.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {/* Notification content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${
                          notif.read ? 'text-muted-foreground' : 'text-foreground font-medium'
                        }`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatNotificationTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            
            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setNotificationDropdownOpen(false);
                      // Navigate to notifications page if you have one
                    }}
                  >
                    {t('header.view-all-notifications') || 'View all notifications'}
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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

    {/* Lead Preview Modal - opened from search or notifications */}
    <LeadPreviewModal
      isOpen={isLeadModalOpen}
      onClose={() => { setIsLeadModalOpen(false); setSelectedLeadId(null); }}
      leadId={selectedLeadId}
    />
    </>
  );
};

export default TopHeader;
