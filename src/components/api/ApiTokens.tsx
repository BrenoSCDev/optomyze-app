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
import { Key, Plus, Trash2, Calendar, Copy, Shield, AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react';
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
        title: "Error",
        description: "Failed to fetch API tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token name",
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
        title: "Success",
        description: "API token generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API token",
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
        title: "Success",
        description: "API token deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API token",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Token copied to clipboard",
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
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-blue-800 dark:text-blue-200 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">API Tokens Security Guide</span>
                  </div>
                  {isInfoOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4 text-blue-800 dark:text-blue-200">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    🔑 General Understanding
                  </h4>
                  <ul className="space-y-1 text-sm ml-4">
                    <li><strong>What API tokens are:</strong> They are unique keys used to authenticate applications or users when interacting with APIs.</li>
                    <li><strong>Access level:</strong> Tokens usually grant <strong>the same permissions as the user or system that created them</strong>, which can mean full access to company data.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    ⚖️ Security Considerations
                  </h4>
                  <ul className="space-y-1 text-sm ml-4">
                    <li><strong>Confidentiality:</strong> Tokens must be treated like <strong>passwords</strong>—never hard-coded in public code, never shared in plain text, and never posted in documentation or chat tools.</li>
                    <li><strong>Storage:</strong> Store tokens in a <strong>secure secrets manager</strong> or encrypted environment variables, not in source code or emails.</li>
                    <li><strong>Rotation:</strong> Regularly regenerate tokens to reduce risk if one is leaked.</li>
                    <li><strong>Revocation:</strong> Have a process to immediately revoke tokens that are no longer needed or may have been compromised.</li>
                    <li><strong>Least privilege principle:</strong> If possible, issue tokens with only the minimal access required, not blanket permissions.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    📊 Business Awareness
                  </h4>
                  <ul className="space-y-1 text-sm ml-4">
                    <li><strong>Data exposure risk:</strong> A leaked token can allow attackers to extract, modify, or delete CRM and customer data.</li>
                    <li><strong>Compliance impact:</strong> Mishandling tokens can result in GDPR, HIPAA, or other regulatory issues.</li>
                    <li><strong>Employee access control:</strong> Only authorized staff should be able to generate, view, or manage tokens.</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium">
                    👉 In short: <strong>API tokens are like digital master keys</strong> — they unlock systems, so they need strong policies around creation, storage, use, monitoring, and revocation.
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
                API Tokens
              </CardTitle>
              <CardDescription>
                Manage your API tokens for accessing your account programmatically
              </CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New API Token</DialogTitle>
                  <DialogDescription>
                    Create a new API token to access your account programmatically.
                  </DialogDescription>
                </DialogHeader>
                
                {!generatedToken ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input
                        id="tokenName"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        placeholder="e.g., Production API Access"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Your New API Token</Label>
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
                        Make sure to copy your token now. You won't be able to see it again!
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!generatedToken ? (
                    <>
                      <Button variant="outline" onClick={closeModal}>
                        Cancel
                      </Button>
                      <Button onClick={generateToken}>
                        Generate Token
                      </Button>
                    </>
                  ) : (
                    <Button onClick={closeModal}>
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading tokens...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Key className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">No API tokens yet</h3>
                <p className="text-muted-foreground">
                  Generate your first API token to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                                Delete API Token
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the token "{token.name}"? This action cannot be undone and will immediately revoke access for any applications using this token.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTokenToDelete(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteToken}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Token
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