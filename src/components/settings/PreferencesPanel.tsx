import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Moon, Sun, Globe, GripVertical, PanelLeft, PanelTop, Search, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Brasil from '@/assets/brasil.png';
import Spain from '@/assets/spain.png';
import Germany from '@/assets/germany.png';
import USA from '@/assets/eua.png';

const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [darkMode, setDarkMode] = useState(true);
  const [navLayout, setNavLayout] = useState<'sidebar' | 'header'>('sidebar');
  const [searchBehavior, setSearchBehavior] = useState('leads');
  const [selectedSound, setSelectedSound] = useState('default');
  const [menuOrder, setMenuOrder] = useState([
    'Dashboards',
    'Leads',
    'Deals',
    'Inboxes',
    'Organization',
    'Settings',
    'Integrations',
    'Activity',
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...menuOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    setMenuOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your CRM experience</p>
        </div>

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
                <div className="flex items-center gap-2">
                  <img
                    src={languages.find(l => l.code === language)?.flag}
                    alt=""
                    className="h-4 w-4 rounded-sm object-cover"
                  />
                  <SelectValue />
                </div>
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
            <div className="flex items-start gap-3 mb-4">
              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Customize Menu Order</p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag items to reorder the sidebar navigation</p>
              </div>
            </div>
            <div className="space-y-1 ml-7">
              {menuOrder.map((item, index) => (
                <motion.div
                  key={item}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
                  onDragEnd={handleDragEnd}
                  layout
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
                    border border-transparent transition-colors
                    ${draggedIndex === index ? 'bg-accent/10 border-accent/30' : 'hover:bg-white/[0.04]'}
                  `}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </motion.div>
              ))}
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
