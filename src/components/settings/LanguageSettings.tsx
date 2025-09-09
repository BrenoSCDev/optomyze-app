/**
 * LANGUAGE SETTINGS COMPONENT
 * 
 * Allows users to select their preferred language for the CRM interface
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, Globe } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface LanguageSettingsProps {
  onBack: () => void;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ onBack }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en' as Language, name: t('language.english'), flag: '🇺🇸' },
    { code: 'pt-BR' as Language, name: t('language.portuguese'), flag: '🇧🇷' },
    { code: 'de' as Language, name: t('language.german'), flag: '🇩🇪' },
    { code: 'es' as Language, name: t('language.spanish'), flag: '🇪🇸' },
  ];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    toast.success(t('common.success'), {
      description: `Language changed to ${languages.find(l => l.code === newLanguage)?.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 -ml-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('settings.languages.title')}
            </h1>
          </div>
          
          <p className="text-muted-foreground">
            {t('settings.languages.description')}
          </p>
        </div>

        {/* Current Language Display */}
        <Card className="glass-card mb-6 border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              {t('settings.languages.current')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {languages.find(l => l.code === language)?.flag}
              </span>
              <span className="text-lg font-medium text-foreground">
                {languages.find(l => l.code === language)?.name}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection */}
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              {t('settings.languages.select')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose your preferred language for the CRM interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={language} 
              onValueChange={handleLanguageChange}
              className="space-y-4"
            >
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={lang.code} 
                    id={lang.code}
                    className="border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:text-primary"
                  />
                  <Label 
                    htmlFor={lang.code}
                    className="flex items-center gap-3 cursor-pointer text-foreground hover:text-primary transition-colors flex-1 py-3"
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-base font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanguageSettings;