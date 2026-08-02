/**
 * AUTH PREFERENCES
 *
 * Theme and language controls for the signed-out screens.
 *
 * There is no account to write to here, so both changes land in localStorage
 * via UserPreferencesContext, which also records that they were made before
 * sign-in. Signing in then carries exactly those choices onto the account —
 * see the reconcile step in UserPreferencesContext.
 *
 * Kept to two controls on purpose: someone who cannot read the form needs the
 * language, and someone on a bright screen needs the theme. Everything else
 * belongs in Settings, behind a login.
 */

import React from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Language, useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import Brasil from '@/assets/brasil.png';
import Germany from '@/assets/germany.png';
import Spain from '@/assets/spain.png';
import USA from '@/assets/eua.png';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en' as Language,    label: 'English',    flag: USA },
  { code: 'pt-BR' as Language, label: 'Português',  flag: Brasil },
  { code: 'de' as Language,    label: 'Deutsch',    flag: Germany },
  { code: 'es' as Language,    label: 'Español',    flag: Spain },
];

const AuthPreferences: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode } = useTheme();

  const active = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];
  const nextMode = mode === 'dark' ? 'light' : 'dark';

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2 text-muted-foreground">
            <img src={active.flag} alt="" aria-hidden="true" className="h-4 w-5 rounded-[2px] object-cover" />
            <span className="text-xs font-medium">{active.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {LANGUAGES.map(({ code, label, flag }) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className="gap-2"
            >
              <img src={flag} alt="" aria-hidden="true" className="h-4 w-5 rounded-[2px] object-cover" />
              <span className="flex-1">{label}</span>
              {code === language && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMode(nextMode)}
            className="text-muted-foreground"
            aria-label={t(mode === 'dark' ? 'auth.switch-to-light' : 'auth.switch-to-dark')}
          >
            {mode === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t(mode === 'dark' ? 'auth.switch-to-light' : 'auth.switch-to-dark')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default AuthPreferences;
