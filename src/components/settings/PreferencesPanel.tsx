import React, { useState, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { useOptus } from '@/contexts/OptusContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import SEARCH_TARGETS, { SearchTargetId } from '@/lib/searchConfig';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Moon, Sun, Globe, GripVertical, Search, Bot, Volume2, Info, X, RotateCcw,
  BarChart3, Users, Settings as SettingsIcon, PieChart, Plug, Database, Building, Inbox,
  CalendarDays, Package, Headphones, Play, VolumeX
} from 'lucide-react';
import { MdCurrencyExchange } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import Brasil from '@/assets/brasil.png';
import Spain from '@/assets/spain.png';
import Germany from '@/assets/germany.png';
import USA from '@/assets/eua.png';
import {
  NOTIFICATION_SOUNDS,
  NotificationSoundId,
  previewSound,
} from '@/lib/notificationSounds';


const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode } = useTheme();
  const { user } = useAuth();
  const { enabled: optusEnabled, setEnabled: setOptusEnabled } = useOptus();
  const { preferences, updatePreferences } = useUserPreferences();
  const searchTarget = preferences.default_search_target as SearchTargetId;
  const selectedSound = preferences.notification_sound as NotificationSoundId;



  const languages = [
    { code: 'en' as Language, name: 'English', flag: USA, nativeName: 'English' },
    { code: 'pt-BR' as Language, name: 'Português', flag: Brasil, nativeName: 'Português' },
    { code: 'de' as Language, name: 'Deutsch', flag: Germany, nativeName: 'Deutsch' },
    { code: 'es' as Language, name: 'Español', flag: Spain, nativeName: 'Español' },
  ];

  const handleSoundChange = useCallback((id: string) => {
    const soundId = id as NotificationSoundId;
    void updatePreferences({ notification_sound: soundId });
    if (soundId !== 'none') {
      previewSound(soundId);
    }
    toast.success(t('settings.preferences.toast.sound-updated'));
  }, [t, updatePreferences]);

  const handlePreviewSound = useCallback((e: React.MouseEvent, id: NotificationSoundId) => {
    e.preventDefault();
    e.stopPropagation();
    previewSound(id);
  }, []);
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
    const selectedLang = languages.find(l => l.code === newLanguage);
    toast.success(t('settings.preferences.toast.language-updated'), {
      description: t('settings.preferences.toast.language-changed').replace('{name}', selectedLang?.name || ''),
    });
  };



  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const isDark = mode === 'dark';

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{t('settings.preferences.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.preferences.description')}</p>
        </div>

        {/* Settings rows container */}
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card">

          {/* 1. Appearance - Mode Toggle */}
          <SettingRow
            icon={isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
            title={t('settings.preferences.appearance')}
            description={t('settings.preferences.appearance-desc')}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => {
                  setMode(checked ? 'dark' : 'light');
                  toast.success(checked ? t('settings.preferences.toast.dark-mode') : t('settings.preferences.toast.light-mode'));
                }}
              />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </SettingRow>




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

          {/* 3b. Optus AI Assistant */}
          <SettingRow
            icon={<Bot className="h-4 w-4 text-muted-foreground" />}
            title={t('settings.preferences.optus')}
            description={t('settings.preferences.optus-desc')}
          >
            <Switch
              checked={optusEnabled}
              onCheckedChange={(checked) => {
                setOptusEnabled(checked);
                toast.success(
                  checked
                    ? t('settings.preferences.toast.optus-on')
                    : t('settings.preferences.toast.optus-off')
                );
              }}
            />
          </SettingRow>

          <Divider />

          {/* 6. Header Search Behavior */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.preferences.search-target')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('settings.preferences.search-target-desc')}</p>
              </div>
            </div>
            <div className="ml-7 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(SEARCH_TARGETS) as SearchTargetId[]).map((targetId) => {
                const config = SEARCH_TARGETS[targetId];
                const Icon = config.icon;
                const isSelected = searchTarget === targetId;
                return (
                  <button
                    key={targetId}
                    onClick={() => {
                      void updatePreferences({ default_search_target: targetId });
                      // t(), not the raw key — this was rendering "nav.leads"
                      // to the user and reading as a missing translation.
                      toast.success(
                        t('settings.preferences.toast.search-target').replace('{name}', t(config.labelKey)),
                      );
                    }}
                    className={`
                      flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-colors duration-fast ease-standard cursor-pointer
                      ${isSelected
                        ? 'border-accent bg-accent/10 shadow-sm shadow-accent/10'
                        : 'border-border/40 hover:border-border/80 hover:bg-muted/50'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium transition-colors ${isSelected ? 'text-accent' : 'text-muted-foreground'}`}>
                      {t(config.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* 7. Notification Sounds */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <Volume2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.preferences.notification-sound')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('settings.preferences.notification-sound-desc')}</p>
              </div>
            </div>
            <div className="ml-7">
              <RadioGroup value={selectedSound} onValueChange={handleSoundChange} className="space-y-1">
                {NOTIFICATION_SOUNDS.map((sound) => (
                  <label
                    key={sound.id}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group
                      ${selectedSound === sound.id ? 'bg-accent/10' : 'hover:bg-muted/50'}
                    `}
                  >
                    <RadioGroupItem value={sound.id} id={sound.id} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground/80">{sound.label}</span>
                      <p className="text-[11px] text-muted-foreground">{sound.description}</p>
                    </div>
                    {sound.id !== 'none' && (
                      <button
                        type="button"
                        onClick={(e) => handlePreviewSound(e, sound.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                        title={`Preview ${sound.label}`}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {sound.id === 'none' && (
                      <VolumeX className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    )}
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
