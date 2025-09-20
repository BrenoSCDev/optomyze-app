/**
 * API MANAGEMENT COMPONENT
 * 
 * Provides API token management and API setup configuration with:
 * - Tokens tab for managing API keys and authentication
 * - API Setup tab for configuring API endpoints and documentation
 * - Coming soon content for future API management features
 * 
 * Design Features:
 * - Tabbed interface with smooth transitions
 * - Glassmorphism cards with consistent styling
 * - Coming soon indicators with modern design
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Settings, Code, Globe, Lock, Plus, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

const ApiManagement = () => {
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
          API Management
        </h1>
        <p className="text-muted-foreground">
          Manage your API tokens, configure endpoints, and access documentation
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Tokens
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Setup
          </TabsTrigger>
        </TabsList>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-6">
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
                    API Tokens
                  </CardTitle>
                  <CardDescription>
                    Manage your API authentication tokens
                  </CardDescription>
                </div>
                <Button disabled className="opacity-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Coming Soon Content */}
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">API Tokens Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create and manage secure API tokens for authentication. Control access, 
                      set expiration dates, and monitor token usage.
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
        </TabsContent>

        {/* API Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiManagement;