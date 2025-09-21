/**
 * API TOKENS MANAGEMENT COMPONENT
 * 
 * Provides API token management with:
 * - Token creation and management interface
 * - Coming soon content for future token features
 * - Glassmorphism design with modern UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Key, Lock, Plus, Copy, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

const ApiTokens = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {t('api.tokens.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('api.tokens.description')}
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                {t('api.tokens.title')}
              </CardTitle>
              <CardDescription>
                {t('api.tokens.description')}
              </CardDescription>
            </div>
            <Button disabled className="opacity-50">
              <Plus className="h-4 w-4 mr-2" />
              {t('users.manage.create-user').replace('User', 'Token')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coming Soon Content */}
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('api.tokens.coming-soon')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('api.tokens.coming-soon-description')}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Feature in Development
              </Badge>
            </div>

            {/* Preview Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="h-4 w-4" />
                  <span className="font-medium">Personal Access Token</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to your account resources
                </p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Webhook Token</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Limited access for webhook integrations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApiTokens;