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
import { Key, Plus, Trash2, Calendar, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const deleteToken = async (tokenId: string) => {
    try {
      await api.delete(`/api/tokens/${tokenId}`);
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteToken(token.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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