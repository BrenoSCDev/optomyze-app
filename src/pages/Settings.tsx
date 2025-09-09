/**
 * SETTINGS PAGE
 * 
 * Main settings page with navigation to different settings sections
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSettings from '@/components/settings/LanguageSettings';

const Settings = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'languages') {
    return <LanguageSettings onBack={() => setActiveSection(null)} />;
  }

  const settingsItems = [
    {
      id: 'languages',
      title: t('nav.languages'),
      description: t('settings.languages.description'),
      icon: Languages,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage your CRM preferences and configuration
          </p>
        </div>

        <div className="grid gap-6">
          {settingsItems.map((item) => (
            <Card 
              key={item.id}
              className="glass-card cursor-pointer hover:shadow-lg transition-all duration-200 border border-white/10"
              onClick={() => setActiveSection(item.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;