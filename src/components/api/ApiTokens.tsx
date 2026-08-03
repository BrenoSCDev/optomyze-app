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
import { Key, Plus, Trash2, Calendar, Copy, Shield, AlertTriangle, ChevronDown, ChevronRight, Info, Lock, Eye, RotateCcw, Ban, FileText, Building2, Globe, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { allowedOriginsApi, type AllowedOrigin } from '@/services/allowedOriginsApi';

interface ApiToken {
  id: string;
  name: string;
  created_at: string;
  expires_at?: string | null;
  token?: string;
  allowed_origins?: AllowedOrigin[];
  rate_limit_per_minute?: number | null;
}

const ApiTokens = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiresAt, setNewTokenExpiresAt] = useState('');
  const [newTokenOriginIds, setNewTokenOriginIds] = useState<number[]>([]);
  const [newTokenRateLimit, setNewTokenRateLimit] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState<AllowedOrigin[]>([]);
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
  const [editTokenOriginIds, setEditTokenOriginIds] = useState<number[]>([]);
  const [editTokenRateLimit, setEditTokenRateLimit] = useState('');
  const [savingOrigins, setSavingOrigins] = useState(false);

  // Fetch tokens and allowed origins on component mount
  useEffect(() => {
    fetchTokens();
    fetchAllowedOrigins();
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

  const fetchAllowedOrigins = async () => {
    try {
      const data = await allowedOriginsApi.getAll();
      setAllowedOrigins(data);
    } catch (error) {
      // Allowed origins are optional context for this page; fail silently.
    }
  };

  const toggleNewTokenOrigin = (originId: number) => {
    setNewTokenOriginIds(prev =>
      prev.includes(originId) ? prev.filter(id => id !== originId) : [...prev, originId]
    );
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
      const response = await api.post('/api/tokens', {
        name: newTokenName,
        expires_at: newTokenExpiresAt ? new Date(newTokenExpiresAt).toISOString() : null,
        allowed_origin_ids: newTokenOriginIds,
        rate_limit_per_minute: newTokenRateLimit.trim() ? Number(newTokenRateLimit) : null,
      });
      const newToken = response.data;

      setTokens(prev => [...prev, newToken]);
      setGeneratedToken(newToken.token);
      setNewTokenName('');
      setNewTokenExpiresAt('');
      setNewTokenOriginIds([]);
      setNewTokenRateLimit('');

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

  const openEditOrigins = (token: ApiToken) => {
    setEditingToken(token);
    setEditTokenOriginIds((token.allowed_origins || []).map(o => o.id));
    setEditTokenRateLimit(token.rate_limit_per_minute != null ? String(token.rate_limit_per_minute) : '');
  };

  const toggleEditTokenOrigin = (originId: number) => {
    setEditTokenOriginIds(prev =>
      prev.includes(originId) ? prev.filter(id => id !== originId) : [...prev, originId]
    );
  };

  const saveTokenOrigins = async () => {
    if (!editingToken) return;

    setSavingOrigins(true);
    try {
      const response = await api.put(`/api/tokens/${editingToken.id}`, {
        allowed_origin_ids: editTokenOriginIds,
        rate_limit_per_minute: editTokenRateLimit.trim() ? Number(editTokenRateLimit) : null,
      });
      const updated = response.data;

      setTokens(prev => prev.map(token => (token.id === editingToken.id ? { ...token, ...updated } : token)));
      setEditingToken(null);

      toast({
        title: t('common.success'),
        description: t('api.tokens.update-settings-success'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.tokens.update-settings-error'),
        variant: "destructive",
      });
    } finally {
      setSavingOrigins(false);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTokenName('');
    setNewTokenExpiresAt('');
    setNewTokenOriginIds([]);
    setNewTokenRateLimit('');
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
                  <div className="p-4 rounded-lg bg-surface-20 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
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

                  <div className="p-4 rounded-lg bg-surface-20 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
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

                  <div className="p-4 rounded-lg bg-surface-20 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
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
          {/* Neither a title nor a subtitle here: the page header above carries
              both, and repeating them read as the same section twice. What is
              left is the card's action bar. */}
          <CardHeader className="flex flex-row items-center justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
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
                    <div>
                      <Label htmlFor="tokenExpiresAt">{t('api.tokens.expires-at')}</Label>
                      <Input
                        id="tokenExpiresAt"
                        type="datetime-local"
                        value={newTokenExpiresAt}
                        onChange={(e) => setNewTokenExpiresAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('api.tokens.expires-at-hint')}
                      </p>
                    </div>
                    <div>
                      <Label>{t('api.tokens.allowed-origins-label')}</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t('api.tokens.allowed-origins-hint')}
                      </p>
                      {allowedOrigins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('api.tokens.no-origins-available')}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-3">
                          {allowedOrigins.map((origin) => (
                            <div key={origin.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`new-token-origin-${origin.id}`}
                                checked={newTokenOriginIds.includes(origin.id)}
                                onCheckedChange={() => toggleNewTokenOrigin(origin.id)}
                              />
                              <Label htmlFor={`new-token-origin-${origin.id}`} className="font-mono text-sm font-normal cursor-pointer">
                                {origin.url}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="tokenRateLimit">{t('api.tokens.rate-limit-label')}</Label>
                      <Input
                        id="tokenRateLimit"
                        type="number"
                        min={1}
                        value={newTokenRateLimit}
                        onChange={(e) => setNewTokenRateLimit(e.target.value)}
                        placeholder={t('api.tokens.rate-limit-placeholder')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('api.tokens.rate-limit-hint')}
                      </p>
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
                    <TableHead>{t('api.tokens.expires')}</TableHead>
                    <TableHead>{t('api.tokens.column-origins')}</TableHead>
                    <TableHead>{t('api.tokens.column-rate-limit')}</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        {token.expires_at ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className={isExpired(token.expires_at) ? 'text-destructive font-medium' : ''}>
                              {formatDateTime(token.expires_at)}
                            </span>
                            {isExpired(token.expires_at) && (
                              <Badge variant="destructive" className="text-xs">
                                {t('api.tokens.expired')}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">{t('api.tokens.never-expires')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {token.allowed_origins && token.allowed_origins.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {token.allowed_origins.map((origin) => (
                              <Badge key={origin.id} variant="outline" className="font-mono text-xs">
                                {origin.url}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">{t('api.tokens.allowed-origins-none')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {token.rate_limit_per_minute != null ? (
                          <Badge variant="outline" className="text-xs">
                            {t('api.tokens.rate-limit-value').replace('{count}', String(token.rate_limit_per_minute))}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/60">{t('api.tokens.rate-limit-unlimited')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditOrigins(token)}
                          title={t('api.tokens.edit-settings')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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

      {/* Edit Token Settings Modal (Allowed Origins + Rate Limit) */}
      <Dialog open={!!editingToken} onOpenChange={(open) => !open && setEditingToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('api.tokens.edit-settings')}</DialogTitle>
            <DialogDescription>
              {t('api.tokens.edit-settings-description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('api.tokens.allowed-origins-label')}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t('api.tokens.allowed-origins-hint')}
              </p>
              {allowedOrigins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('api.tokens.no-origins-available')}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-3">
                  {allowedOrigins.map((origin) => (
                    <div key={origin.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-token-origin-${origin.id}`}
                        checked={editTokenOriginIds.includes(origin.id)}
                        onCheckedChange={() => toggleEditTokenOrigin(origin.id)}
                      />
                      <Label htmlFor={`edit-token-origin-${origin.id}`} className="font-mono text-sm font-normal cursor-pointer">
                        {origin.url}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="editTokenRateLimit">{t('api.tokens.rate-limit-label')}</Label>
              <Input
                id="editTokenRateLimit"
                type="number"
                min={1}
                value={editTokenRateLimit}
                onChange={(e) => setEditTokenRateLimit(e.target.value)}
                placeholder={t('api.tokens.rate-limit-placeholder')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('api.tokens.rate-limit-hint')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingToken(null)} disabled={savingOrigins}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveTokenOrigins} disabled={savingOrigins}>
              {savingOrigins ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiTokens;