/**
 * LANGUAGES DASHBOARD COMPONENT
 * 
 * Creative language selection interface with interactive country flags
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Globe, Sparkles } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const LanguagesDashboard: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { 
      code: 'en' as Language, 
      name: t('language.english'), 
      flag: '🇺🇸',
      nativeName: 'English',
      country: 'United States',
      gradient: 'from-blue-600/20 via-red-600/10 to-blue-600/20'
    },
    { 
      code: 'pt-BR' as Language, 
      name: t('language.portuguese'), 
      flag: '🇧🇷',
      nativeName: 'Português',
      country: 'Brasil',
      gradient: 'from-green-600/20 via-yellow-600/10 to-blue-600/20'
    },
    { 
      code: 'de' as Language, 
      name: t('language.german'), 
      flag: '🇩🇪',
      nativeName: 'Deutsch',
      country: 'Deutschland',
      gradient: 'from-gray-600/20 via-red-600/10 to-yellow-600/20'
    },
    { 
      code: 'es' as Language, 
      name: t('language.spanish'), 
      flag: '🇪🇸',
      nativeName: 'Español',
      country: 'España',
      gradient: 'from-red-600/20 via-yellow-600/10 to-red-600/20'
    },
  ];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const selectedLang = languages.find(l => l.code === newLanguage);
    toast.success(t('common.success'), {
      description: `Language changed to ${selectedLang?.name}`,
    });
  };

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4 p-3 rounded-full bg-gradient-primary">
            <Globe className="h-8 w-8 text-white" />
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            {t('settings.languages.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('settings.languages.description')}
          </p>
        </div>

        {/* Current Language Spotlight */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl"></div>
          <Card className="relative glass-card border border-white/20 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${currentLang?.gradient} opacity-30`}></div>
            <CardContent className="relative p-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-8xl mb-4 animate-bounce">
                      {currentLang?.flag}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-semibold uppercase tracking-wide text-sm">
                        {t('settings.languages.current')}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentLang?.nativeName}
                  </h2>
                  <p className="text-purple-300 text-lg">
                    {currentLang?.country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Selection Grid */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            {t('settings.languages.select')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              
              return (
                <div
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    relative group cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${isSelected ? 'scale-105' : 'hover:scale-110'}
                  `}
                >
                  {/* Glow effect for selected language */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-primary opacity-40 blur-2xl rounded-2xl animate-pulse"></div>
                  )}
                  
                  <Card className={`
                    relative glass-card border overflow-hidden transition-all duration-300
                    ${isSelected 
                      ? 'border-purple-400 shadow-glow' 
                      : 'border-white/10 hover:border-white/30'
                    }
                  `}>
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${lang.gradient} opacity-20`}></div>
                    
                    <CardContent className="relative p-6 text-center">
                      {/* Flag with hover animation */}
                      <div className={`
                        text-6xl mb-4 transition-transform duration-300
                        ${isSelected ? 'animate-bounce' : 'group-hover:scale-110'}
                      `}>
                        {lang.flag}
                      </div>
                      
                      {/* Language info */}
                      <h4 className="text-xl font-bold text-white mb-1">
                        {lang.nativeName}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {lang.country}
                      </p>
                      
                      {/* Selection indicator */}
                      <div className={`
                        flex items-center justify-center gap-2 transition-all duration-300
                        ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
                      `}>
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Selected</span>
                          </>
                        ) : (
                          <span className="text-white text-sm font-medium">Click to select</span>
                        )}
                      </div>
                    </CardContent>
                    
                    {/* Selected border glow */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-lg border-2 border-purple-400 animate-pulse"></div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language Stats */}
        <Card className="glass-card border border-white/10 mt-12">
          <CardHeader>
            <CardTitle className="text-center text-white">
              Language Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              {languages.map((lang) => (
                <div key={lang.code} className="p-4">
                  <div className="text-2xl mb-2">{lang.flag}</div>
                  <div className={`text-lg font-bold ${language === lang.code ? 'text-purple-400' : 'text-white'}`}>
                    {lang.nativeName}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {language === lang.code ? 'Active' : 'Available'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanguagesDashboard;