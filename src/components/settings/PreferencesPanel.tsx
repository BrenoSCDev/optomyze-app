import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Moon, Sun, Globe, GripVertical, PanelLeft, PanelTop, Search, Volume2, Info, X, RotateCcw,
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
        ${isDragging ? 'opacity-40 border-accent/30 bg-accent/5' : 'border-transparent hover:bg-white/[0.04]'}
        ${isActive ? 'bg-accent/10 border-accent/20' : ''}
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div className="text-muted-foreground/70">{icon}</div>
      <span className="text-sm text-foreground/80">{label}</span>
    </div>
  );
};

const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { menuOrder, setMenuOrder, resetToDefault, bannerDismissed, dismissBanner } = useMenuOrder();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [navLayout, setNavLayout] = useState<'sidebar' | 'header'>('sidebar');
  const [searchBehavior, setSearchBehavior] = useState('leads');
  const [selectedSound, setSelectedSound] = useState('default');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter menu items based on user role (same logic as sidebar)
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
              className="rounded-lg border border-border/40 px-4 py-3 flex items-start gap-3"
              style={{ background: 'hsl(0 0% 9%)' }}
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
        <div className="rounded-xl border border-border/60 overflow-hidden" style={{ background: 'hsl(0 0% 7%)' }}>

          {/* 1. Dark Mode / Light Mode */}
          <SettingRow
            icon={darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
            title="Appearance"
            description="Switch between dark and light mode"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </SettingRow>

          <Divider />

          {/* 2. Language Selection */}
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

          {/* 3. Customize Menu Order */}
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

          {/* 4. Navigation Layout (Desktop Only) */}
          {!isMobile && (
            <>
              <SettingRow
                icon={navLayout === 'sidebar' ? <PanelLeft className="h-4 w-4 text-muted-foreground" /> : <PanelTop className="h-4 w-4 text-muted-foreground" />}
                title="Navigation Layout"
                description="Choose between sidebar or top bar navigation"
              >
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  <button
                    onClick={() => setNavLayout('sidebar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      navLayout === 'sidebar'
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                    }`}
                  >
                    <PanelLeft className="h-3.5 w-3.5" />
                    Sidebar
                  </button>
                  <button
                    onClick={() => setNavLayout('header')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border/60 ${
                      navLayout === 'header'
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
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

          {/* 5. Header Search Behavior */}
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

          {/* 6. Notification Sounds */}
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
                      ${selectedSound === sound.id ? 'bg-accent/10' : 'hover:bg-white/[0.04]'}
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
