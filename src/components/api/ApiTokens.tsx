/**
 * API TOKENS MANAGEMENT COMPONENT
 * 
 * Provides API token management with:
 * - Token fetching and display in table format
 * - Token creation via modal
 * - Token deletion functionality
 * - Glassmorphism design with modern UI
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2, Calendar, Copy, Shield, AlertTriangle, ChevronDown, ChevronRight, Info, Lock, Eye, RotateCcw, Ban, FileText, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

interface ApiToken {
  id: string;
  name: string;
  created_at: string;
  token?: string;
}

const ApiTokens = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tokens');
      setTokens(response.data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.tokens.fetch-error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: t('common.error'),
        description: t('api.tokens.name-required'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post('/api/tokens', { name: newTokenName });
      const newToken = response.data;
      
      setTokens(prev => [...prev, newToken]);
      setGeneratedToken(newToken.token);
      setNewTokenName('');
      
      toast({
        title: t('common.success'),
        description: t('api.tokens.generated-success'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.tokens.generate-error'),
        variant: "destructive",
      });
    }
  };

  const deleteToken = async () => {
    if (!tokenToDelete) return;
    
    try {
      await api.delete(`/api/tokens/${tokenToDelete}`);
      setTokens(prev => prev.filter(token => token.id !== tokenToDelete));
      setTokenToDelete(null);
      
      toast({
        title: t('common.success'),
        description: t('api.tokens.deleted-success'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.tokens.delete-error'),
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('api.tokens.copied'),
      description: t('api.tokens.copied-description'),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTokenName('');
    setGeneratedToken(null);
  };

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

      {/* API Tokens Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="p-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-blue-800 dark:text-blue-200 hover:text-blue-800 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">{t('api.tokens.security-guide')}</span>
                  </div>
                  {isInfoOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-6 text-blue-800 dark:text-blue-200">
                <div className="grid gap-4">
                  <div className="p-4 rounded-lg bg-white/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {t('api.tokens.general-understanding')}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium">{t('api.tokens.what-are')}</span> {t('api.tokens.what-are-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium">{t('api.tokens.access-level')}</span> {t('api.tokens.access-level-description')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {t('api.tokens.security-considerations')}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Lock className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.confidentiality')}</span> {t('api.tokens.confidentiality-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.storage')}</span> {t('api.tokens.storage-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <RotateCcw className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.rotation')}</span> {t('api.tokens.rotation-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Ban className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.revocation')}</span> {t('api.tokens.revocation-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Eye className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.least-privilege')}</span> {t('api.tokens.least-privilege-description')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {t('api.tokens.business-awareness')}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-3 w-3 mt-1 text-orange-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.data-exposure')}</span> {t('api.tokens.data-exposure-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.compliance')}</span> {t('api.tokens.compliance-description')}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Eye className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{t('api.tokens.employee-access')}</span> {t('api.tokens.employee-access-description')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium">
                    {t('api.tokens.summary')}
                  </p>
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
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
                {t('api.tokens.card-description')}
              </CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('api.tokens.generate-token')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('api.tokens.generate-new')}</DialogTitle>
                  <DialogDescription>
                    {t('api.tokens.generate-description')}
                  </DialogDescription>
                </DialogHeader>
                
                {!generatedToken ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tokenName">{t('api.tokens.token-name')}</Label>
                      <Input
                        id="tokenName"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        placeholder={t('api.tokens.token-name-placeholder')}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>{t('api.tokens.your-new-token')}</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={generatedToken}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(generatedToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('api.tokens.copy-warning')}
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!generatedToken ? (
                    <>
                      <Button variant="outline" onClick={closeModal}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={generateToken}>
                        {t('api.tokens.generate-token')}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={closeModal}>
                      {t('api.tokens.done')}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('api.tokens.loading')}</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Key className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('api.tokens.no-tokens')}</h3>
                <p className="text-muted-foreground">
                  {t('api.tokens.no-tokens-description')}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('api.tokens.name')}</TableHead>
                    <TableHead>{t('api.tokens.created')}</TableHead>
                    <TableHead className="text-right">{t('api.tokens.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">{token.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(token.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setTokenToDelete(token.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                {t('api.tokens.delete-token')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('api.tokens.delete-confirmation')} "{token.name}"? {t('api.tokens.delete-warning')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTokenToDelete(null)}>
                                {t('common.cancel')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteToken}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('api.tokens.delete-token')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApiTokens;