/**
 * ICON PICKER DIALOG
 *
 * Curated set of ~93 lucide-react icons (already installed, no extra dependency).
 * Stores the icon name string (e.g. "Package") and resolves it at render time.
 * All imports are named — Rollup tree-shakes them individually, keeping the bundle small.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Settings, Settings2, SlidersHorizontal, Cog, Wrench,
  User, Users, UserCheck, UserPlus, Contact, Headphones,
  Briefcase, Building, Building2, Landmark, Store,
  DollarSign, CreditCard, Banknote, Wallet, CircleDollarSign, Percent, TrendingUp,
  Package, Box, ShoppingBag, ShoppingCart, Tag, Tags, Barcode,
  Car, Truck, Bike, Navigation, MapPin,
  Gauge, BarChart3, LineChart, PieChart, Activity, Target,
  Phone, Mail, MessageSquare, MessageCircle, Bell, BellRing, Globe,
  Calendar, CalendarDays, Clock, Timer, AlarmClock,
  File, FileText, Folder, FolderOpen, Clipboard, ClipboardList,
  Image, Camera, Video, Music, Printer,
  Search, Edit, Pencil, Trash2, Download, Upload, Copy, Link,
  Check, CheckCircle, Star, Heart, Bookmark, Award, Trophy, Shield, ShieldCheck,
  Layers, LayoutGrid, List, Grid, Database, Server,
  Key, Eye, Lock, Zap, Wifi, Flag, Info, AlertCircle, HelpCircle, Code,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Static curated map — key is the string stored in the DB */
export const ICON_MAP: Record<string, LucideIcon> = {
  // General
  Settings, Settings2, SlidersHorizontal, Cog, Wrench,
  // People
  User, Users, UserCheck, UserPlus, Contact, Headphones,
  // Business
  Briefcase, Building, Building2, Landmark, Store,
  // Finance
  DollarSign, CreditCard, Banknote, Wallet, CircleDollarSign, Percent, TrendingUp,
  // Products
  Package, Box, ShoppingBag, ShoppingCart, Tag, Tags, Barcode,
  // Transport
  Car, Truck, Bike, Navigation, MapPin,
  // Analytics
  Gauge, BarChart3, LineChart, PieChart, Activity, Target,
  // Communication
  Phone, Mail, MessageSquare, MessageCircle, Bell, BellRing, Globe,
  // Calendar & Time
  Calendar, CalendarDays, Clock, Timer, AlarmClock,
  // Files & Docs
  File, FileText, Folder, FolderOpen, Clipboard, ClipboardList,
  // Media
  Image, Camera, Video, Music, Printer,
  // Actions
  Search, Edit, Pencil, Trash2, Download, Upload, Copy, Link,
  // Status
  Check, CheckCircle, Star, Heart, Bookmark, Award, Trophy, Shield, ShieldCheck,
  // Layout
  Layers, LayoutGrid, List, Grid, Database, Server,
  // Misc
  Key, Eye, Lock, Zap, Wifi, Flag, Info, AlertCircle, HelpCircle, Code,
};

const ALL_ICONS = Object.entries(ICON_MAP).map(([key, component]) => ({ key, component }));

/** Synchronous — resolves an icon name string to a LucideIcon component, or null */
export function resolveIcon(iconKey: string | null | undefined): LucideIcon | null {
  if (!iconKey) return null;
  return ICON_MAP[iconKey] ?? null;
}

/** Renders a stored icon key synchronously; returns null if key is unknown */
export function IconDisplay({
  iconKey,
  className,
}: {
  iconKey: string | null | undefined;
  className?: string;
}) {
  const Icon = resolveIcon(iconKey);
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onChange: (iconKey: string | null) => void;
}

const IconPickerDialog = ({ open, onOpenChange, value, onChange }: IconPickerDialogProps) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_ICONS;
    return ALL_ICONS.filter((i) => i.key.toLowerCase().includes(q));
  }, [search]);

  const handleSelect = useCallback(
    (key: string) => {
      onChange(key === value ? null : key);
      onOpenChange(false);
    },
    [value, onChange, onOpenChange]
  );

  const handleClear = () => {
    onChange(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Choose Icon</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons… (e.g. box, star, user)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Current selection */}
          {value && (
            <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <IconDisplay iconKey={value} className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary flex-1">{value}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Grid */}
          <ScrollArea className="h-72">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-1">
              {filtered.map(({ key, component: Icon }) => (
                <button
                  key={key}
                  title={key}
                  onClick={() => handleSelect(key)}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors',
                    value === key && 'bg-primary/20 ring-1 ring-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No icons found for "{search}"
              </div>
            )}
          </ScrollArea>

          <p className="text-xs text-muted-foreground text-right">
            {filtered.length} icon{filtered.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ' available'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPickerDialog;
