/**
 * API SETUP CONFIGURATION COMPONENT
 * 
 * Provides API setup and configuration with:
 * - API endpoints configuration
 * - Documentation access
 * - Coming soon content for future setup features
 * - Glassmorphism design with modern UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Code, Globe, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

const ApiSetup = () => {
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
          API Setup
        </h1>
        <p className="text-muted-foreground">
          Configure API endpoints and access comprehensive documentation
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure API endpoints and access documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coming Soon Content */}
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">API Setup Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Access comprehensive API documentation, configure endpoints, 
                  and test API calls directly from the dashboard.
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Feature in Development
              </Badge>
            </div>

            {/* Preview Features */}
            <div className="space-y-4 opacity-50">
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Base URL</span>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <code className="text-sm bg-muted/50 px-2 py-1 rounded">
                  https://api.optomyze.com/v1
                </code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Code className="h-4 w-4" />
                    <span className="font-medium">Documentation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Interactive API documentation
                  </p>
                </div>
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Rate Limits</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configure API usage limits
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApiSetup;