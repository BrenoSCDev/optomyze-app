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
import { Search, Bell, LogOut, UserCircle, ChevronDown, Loader2 } from 'lucide-react';
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
import { searchLeads, LeadSearchResult } from '@/services/leadSearchApi';
import optomyzeLogo from '@/assets/optomyze.png';
import echo from '../../services/echo'

interface TopHeaderProps {
  sidebarCollapsed: boolean;
}

const TopHeader = ({ sidebarCollapsed }: TopHeaderProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchResults, setSearchResults] = useState<LeadSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Mock unread count - will be replaced with real data later
  const unreadNotifications = 3;

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

  // Handle lead selection
  const handleLeadSelect = (lead: LeadSearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/leads/${lead.funnel_id}/lead/${lead.id}`);
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
    echo.connector.pusher.connection.bind('connected', () => {
        console.log('Connected to WebSocket');
        setConnected(true);
    });

    echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
    });
  }, []);

  return (
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
                      {lead.first_name}
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
                          {lead.first_name}
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
