import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useMenuOrder, DEFAULT_MENU_ORDER } from '@/contexts/MenuOrderContext';
import { useTheme, THEME_PRESETS, ThemeName } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Moon, Sun, Globe, GripVertical, PanelLeft, PanelTop, Search, Volume2, Info, X, RotateCcw, Palette, Check,
  BarChart3, Users, Settings as SettingsIcon, PieChart, Plug, Database, Building, MessageCircle,
  CalendarDays, Package, Headphones
} from 'lucide-react';
import { MdCurrencyExchange } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Brasil from '@/assets/brasil.png';
import Spain from '@/assets/spain.png';
import Germany from '@/assets/germany.png';
import USA from '@/assets/eua.png';

// Section metadata for display in the reorder list
const SECTION_META: Record<string, { icon: React.ReactNode; labelKey: string }> = {
  dashboard: { icon: <BarChart3 className="h-4 w-4" />, labelKey: 'nav.dashboard' },
  leads: { icon: <Users className="h-4 w-4" />, labelKey: 'nav.leads' },
  deals: { icon: <MdCurrencyExchange className="h-4 w-4" />, labelKey: 'nav.deals' },
  settings: { icon: <SettingsIcon className="h-4 w-4" />, labelKey: 'nav.settings' },
  reports: { icon: <PieChart className="h-4 w-4" />, labelKey: 'nav.reports' },
  integrations: { icon: <Plug className="h-4 w-4" />, labelKey: 'nav.integrations' },
  api: { icon: <Database className="h-4 w-4" />, labelKey: 'nav.api' },
  organization: { icon: <Building className="h-4 w-4" />, labelKey: 'nav.organization' },
  chat: { icon: <MessageCircle className="h-4 w-4" />, labelKey: 'nav.chat' },
  calendars: { icon: <CalendarDays className="h-4 w-4" />, labelKey: 'nav.calendars' },
  products: { icon: <Package className="h-4 w-4" />, labelKey: 'nav.products' },
  support: { icon: <Headphones className="h-4 w-4" />, labelKey: 'nav.support' },
};

// Sortable item component
const SortableMenuItem: React.FC<{ id: string; label: string; icon: React.ReactNode; isActive: boolean }> = ({ id, label, icon, isActive }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg select-none
        border transition-colors
        ${isDragging ? 'opacity-40 border-accent/30 bg-accent/5' : 'border-transparent hover:bg-muted/50'}
        ${isActive ? 'bg-accent/10 border-accent/20' : ''}
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div className="text-muted-foreground/70">{icon}</div>
      <span className="text-sm text-foreground/80">{label}</span>
    </div>
  );
};

// Theme preview card colors
const THEME_PREVIEW_COLORS: Record<ThemeName, { dark: { bg: string; card: string; accent: string }; light: { bg: string; card: string; accent: string } }> = {
  midnight_pulse: {
    dark: { bg: '#0a0a0a', card: '#1a1a1a', accent: '#a855f7' },
    light: { bg: '#f5f5f5', card: '#ffffff', accent: '#9333ea' },
  },
  emerald_strike: {
    dark: { bg: '#0a0a0a', card: '#1a1a1a', accent: '#22c55e' },
    light: { bg: '#f5f5f5', card: '#ffffff', accent: '#16a34a' },
  },
  crimson_edge: {
    dark: { bg: '#0a0a0a', card: '#1a1a1a', accent: '#ef4444' },
    light: { bg: '#f5f5f5', card: '#ffffff', accent: '#dc2626' },
  },
  ocean_flow: {
    dark: { bg: '#0a0a0a', card: '#1a1a1a', accent: '#3b82f6' },
    light: { bg: '#f5f5f5', card: '#ffffff', accent: '#2563eb' },
  },
};

const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { menuOrder, setMenuOrder, resetToDefault, bannerDismissed, dismissBanner, navLayout, setNavLayout } = useMenuOrder();
  const { mode, theme, setMode, setTheme } = useTheme();
  const { user } = useAuth();
  const [searchBehavior, setSearchBehavior] = useState('leads');
  const [selectedSound, setSelectedSound] = useState('default');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleMenuOrder = menuOrder.filter(id => {
    if (id === 'organization' && user?.role === 'agent') return false;
    return true;
  });

  const languages = [
    { code: 'en' as Language, name: 'English', flag: USA, nativeName: 'English' },
    { code: 'pt-BR' as Language, name: 'Português', flag: Brasil, nativeName: 'Português' },
    { code: 'de' as Language, name: 'Deutsch', flag: Germany, nativeName: 'Deutsch' },
    { code: 'es' as Language, name: 'Español', flag: Spain, nativeName: 'Español' },
  ];

  const soundOptions = [
    { id: 'default', label: 'Default Chime' },
    { id: 'soft-bell', label: 'Soft Bell' },
    { id: 'digital-pop', label: 'Digital Pop' },
    { id: 'subtle-ping', label: 'Subtle Ping' },
    { id: 'none', label: 'No Sound' },
  ];

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
    const selectedLang = languages.find(l => l.code === newLanguage);
    toast.success('Language updated', {
      description: `Changed to ${selectedLang?.name}`,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = menuOrder.indexOf(active.id as string);
    const newIndex = menuOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(menuOrder, oldIndex, newIndex);
    setMenuOrder(newOrder);
    toast.success('Menu order updated');
  };

  const isDefaultOrder = JSON.stringify(menuOrder) === JSON.stringify(DEFAULT_MENU_ORDER);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const activeItem = activeDragId ? SECTION_META[activeDragId] : null;

  const isDark = mode === 'dark';

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your CRM experience</p>
        </div>

        {/* Info Banner */}
        <AnimatePresence>
          {!bannerDismissed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-border/40 bg-muted/50 px-4 py-3 flex items-start gap-3"
            >
              <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">
                Your preferences are saved locally in this browser. If you switch browsers or devices, your settings may be different.
              </p>
              <button onClick={dismissBanner} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings rows container */}
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card">

          {/* 1. Appearance - Mode Toggle */}
          <SettingRow
            icon={isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
            title="Appearance"
            description="Switch between dark and light mode"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => {
                  setMode(checked ? 'dark' : 'light');
                  toast.success(`Switched to ${checked ? 'dark' : 'light'} mode`);
                }}
              />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </SettingRow>

          <Divider />

          {/* 2. Theme Selection */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <Palette className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a color theme for the CRM</p>
              </div>
            </div>
            <div className="ml-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(THEME_PRESETS) as ThemeName[]).map((themeKey) => {
                const preset = THEME_PRESETS[themeKey];
                const colors = THEME_PREVIEW_COLORS[themeKey];
                const preview = isDark ? colors.dark : colors.light;
                const isSelected = theme === themeKey;

                return (
                  <button
                    key={themeKey}
                    onClick={() => {
                      setTheme(themeKey);
                      toast.success(`Theme changed to ${preset.label}`);
                    }}
                    className={`relative rounded-xl border-2 p-3 transition-all duration-200 text-left group ${
                      isSelected
                        ? 'border-accent shadow-md shadow-accent/20'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Preview mockup */}
                    <div
                      className="rounded-lg overflow-hidden mb-3 border border-border/30"
                      style={{ background: preview.bg }}
                    >
                      <div className="h-2.5 flex items-center gap-1 px-2" style={{ background: preview.card, borderBottom: `1px solid ${preview.bg}` }}>
                        <div className="w-1 h-1 rounded-full" style={{ background: preview.accent }} />
                        <div className="w-1 h-1 rounded-full opacity-50" style={{ background: preview.accent }} />
                      </div>
                      <div className="p-2 space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded-full" style={{ background: preview.accent, opacity: 0.8 }} />
                        <div className="flex gap-1">
                          <div className="h-3 flex-1 rounded" style={{ background: preview.card }} />
                          <div className="h-3 flex-1 rounded" style={{ background: preview.card }} />
                        </div>
                        <div className="h-1 w-1/2 rounded-full" style={{ background: preview.accent, opacity: 0.4 }} />
                      </div>
                    </div>

                    {/* Label */}
                    <p className="text-xs font-medium text-foreground">{preset.label}</p>
                    <p className="text-[10px] text-muted-foreground">{preset.description}</p>

                    {/* Accent color dot */}
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-3 h-3 rounded-full border border-border/40" style={{ background: preview.accent }} />
                      <div className="w-3 h-3 rounded-full border border-border/40" style={{ background: preview.accent, opacity: 0.4 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* 3. Language Selection */}
          <SettingRow
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            title={t('settings.languages.title')}
            description={t('settings.languages.description')}
          >
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px] h-9 bg-input/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <img src={lang.flag} alt="" className="h-4 w-4 rounded-sm object-cover" />
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <Divider />

          {/* 4. Customize Menu Order */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Customize Menu Order</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Drag items to reorder the sidebar navigation</p>
                </div>
              </div>
              {!isDefaultOrder && (
                <button
                  onClick={() => { resetToDefault(); toast.success('Menu order reset to default'); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-0.5 ml-7">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={visibleMenuOrder} strategy={verticalListSortingStrategy}>
                  {visibleMenuOrder.map((sectionId) => {
                    const meta = SECTION_META[sectionId];
                    if (!meta) return null;
                    return (
                      <SortableMenuItem
                        key={sectionId}
                        id={sectionId}
                        label={t(meta.labelKey)}
                        icon={meta.icon}
                        isActive={activeDragId === sectionId}
                      />
                    );
                  })}
                </SortableContext>
                <DragOverlay>
                  {activeDragId && activeItem ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/15 border border-accent/30 shadow-lg">
                      <GripVertical className="h-3.5 w-3.5 text-accent/50" />
                      <div className="text-accent/70">{activeItem.icon}</div>
                      <span className="text-sm text-accent font-medium">{t(activeItem.labelKey)}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          <Divider />

          {/* 5. Navigation Layout (Desktop Only) */}
          {!isMobile && (
            <>
              <SettingRow
                icon={navLayout === 'sidebar' ? <PanelLeft className="h-4 w-4 text-muted-foreground" /> : <PanelTop className="h-4 w-4 text-muted-foreground" />}
                title="Navigation Layout"
                description="Choose between sidebar or top bar navigation"
              >
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  <button
                    onClick={() => { setNavLayout('sidebar'); toast.success('Navigation switched to sidebar'); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      navLayout === 'sidebar'
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <PanelLeft className="h-3.5 w-3.5" />
                    Sidebar
                  </button>
                  <button
                    onClick={() => { setNavLayout('header'); toast.success('Navigation switched to header'); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border/60 ${
                      navLayout === 'header'
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <PanelTop className="h-3.5 w-3.5" />
                    Header
                  </button>
                </div>
              </SettingRow>
              <Divider />
            </>
          )}

          {/* 6. Header Search Behavior */}
          <SettingRow
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
            title="Default Search Target"
            description="Choose what the header search bar queries by default"
          >
            <Select value={searchBehavior} onValueChange={setSearchBehavior}>
              <SelectTrigger className="w-[140px] h-9 bg-input/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="deals">Deals</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <Divider />

          {/* 7. Notification Sounds */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <Volume2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Notification Sound</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select the sound for new notifications</p>
              </div>
            </div>
            <div className="ml-7">
              <RadioGroup value={selectedSound} onValueChange={setSelectedSound} className="space-y-1">
                {soundOptions.map((sound) => (
                  <label
                    key={sound.id}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                      ${selectedSound === sound.id ? 'bg-accent/10' : 'hover:bg-muted/50'}
                    `}
                  >
                    <RadioGroupItem value={sound.id} id={sound.id} />
                    <span className="text-sm text-foreground/80">{sound.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Reusable setting row */
const SettingRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="flex items-center justify-between px-4 sm:px-6 py-5 gap-4">
    <div className="flex items-start gap-3 min-w-0">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Divider = () => (
  <div className="mx-4 sm:mx-6 border-t border-border/40" />
);

export default PreferencesPanel;
