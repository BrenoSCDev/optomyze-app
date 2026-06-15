/**
 * ALLOWED ORIGINS MANAGEMENT COMPONENT
 *
 * Lets a company restrict which web origins (domains) are permitted to use
 * its API tokens. Provides CRUD for the company's allowed-origins list.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { allowedOriginsApi, type AllowedOrigin } from '@/services/allowedOriginsApi';

const AllowedOrigins = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [origins, setOrigins] = useState<AllowedOrigin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState<AllowedOrigin | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [originToDelete, setOriginToDelete] = useState<AllowedOrigin | null>(null);

  useEffect(() => {
    fetchOrigins();
  }, []);

  const fetchOrigins = async () => {
    try {
      setLoading(true);
      const data = await allowedOriginsApi.getAll();
      setOrigins(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.allowed-origins.fetch-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrigin = async () => {
    if (!newUrl.trim()) {
      toast({
        title: t('common.error'),
        description: t('api.allowed-origins.url-required'),
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const origin = await allowedOriginsApi.create(newUrl.trim());
      setOrigins(prev => [...prev, origin]);
      setNewUrl('');
      setIsCreateOpen(false);

      toast({
        title: t('common.success'),
        description: t('api.allowed-origins.created-successfully'),
      });
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast({
        title: t('common.error'),
        description: message || t('api.allowed-origins.create-error'),
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (origin: AllowedOrigin) => {
    setEditingOrigin(origin);
    setEditUrl(origin.url);
  };

  const updateOrigin = async () => {
    if (!editingOrigin) return;

    if (!editUrl.trim()) {
      toast({
        title: t('common.error'),
        description: t('api.allowed-origins.url-required'),
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const updated = await allowedOriginsApi.update(editingOrigin.id, editUrl.trim());
      setOrigins(prev => prev.map(o => (o.id === editingOrigin.id ? updated : o)));
      setEditingOrigin(null);

      toast({
        title: t('common.success'),
        description: t('api.allowed-origins.updated-successfully'),
      });
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast({
        title: t('common.error'),
        description: message || t('api.allowed-origins.update-error'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrigin = async () => {
    if (!originToDelete) return;

    try {
      await allowedOriginsApi.delete(originToDelete.id);
      setOrigins(prev => prev.filter(o => o.id !== originToDelete.id));
      setOriginToDelete(null);

      toast({
        title: t('common.success'),
        description: t('api.allowed-origins.deleted-successfully'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.allowed-origins.delete-error'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {t('api.allowed-origins.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('api.allowed-origins.description')}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('api.allowed-origins.title')}
              </CardTitle>
              <CardDescription>
                {t('api.allowed-origins.card-description')}
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('api.allowed-origins.new-origin')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('api.allowed-origins.create-new')}</DialogTitle>
                  <DialogDescription>
                    {t('api.allowed-origins.create-description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="originUrl">{t('api.allowed-origins.url-label')}</Label>
                    <Input
                      id="originUrl"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder={t('api.allowed-origins.url-placeholder')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setNewUrl('');
                    }}
                    disabled={creating}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={createOrigin} disabled={creating || !newUrl.trim()}>
                    {creating ? t('common.creating') : t('common.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </div>
            ) : origins.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('api.allowed-origins.no-origins')}</h3>
                <p className="text-muted-foreground">
                  {t('api.allowed-origins.no-origins-description')}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('api.allowed-origins.url-label')}</TableHead>
                    <TableHead>{t('api.tokens.created')}</TableHead>
                    <TableHead className="text-right">{t('api.tokens.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {origins.map((origin) => (
                    <TableRow key={origin.id}>
                      <TableCell className="font-medium font-mono text-sm">{origin.url}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(origin.created_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(origin)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setOriginToDelete(origin)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                {t('api.allowed-origins.delete')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('api.allowed-origins.delete-confirm')} "{origin.url}"? {t('api.allowed-origins.delete-warning')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setOriginToDelete(null)}>
                                {t('common.cancel')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteOrigin}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common.delete')}
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

      {/* Edit Origin Modal */}
      <Dialog open={!!editingOrigin} onOpenChange={(open) => !open && setEditingOrigin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('api.allowed-origins.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editOriginUrl">{t('api.allowed-origins.url-label')}</Label>
              <Input
                id="editOriginUrl"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder={t('api.allowed-origins.url-placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrigin(null)} disabled={updating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={updateOrigin} disabled={updating || !editUrl.trim()}>
              {updating ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllowedOrigins;
