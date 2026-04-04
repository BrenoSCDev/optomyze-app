/**
 * START CONVERSATION MODAL
 *
 * Allows starting a new WhatsApp conversation from the inbox.
 * Search for an existing lead by name/phone or select one, pick an instance,
 * type the first message, and send.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Loader2, MessageCirclePlus, User } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchWhatsAppInstances,
  searchLeadsForWhatsApp,
  sendWhatsAppMessage,
  WhatsAppInstanceOption,
  LeadSearchResult,
} from '@/services/whatsappChatApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StartConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useLanguage();

  const [instances, setInstances] = useState<WhatsAppInstanceOption[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeadSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadSearchResult | null>(null);

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load instances on open
  useEffect(() => {
    if (!open) return;
    setLoadingInstances(true);
    fetchWhatsAppInstances()
      .then(setInstances)
      .catch(() => {})
      .finally(() => setLoadingInstances(false));
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSearchResults([]);
      setSelectedLead(null);
      setSelectedInstanceId('');
      setMessage('');
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLeadsForWhatsApp(query.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query]);

  const handleSelectLead = (lead: LeadSearchResult) => {
    setSelectedLead(lead);
    setQuery(`${lead.first_name} ${lead.last_name}`.trim());
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!selectedLead || !selectedInstanceId || !message.trim()) return;
    setIsSending(true);
    try {
      await sendWhatsAppMessage(Number(selectedInstanceId), {
        lead_id: selectedLead.id,
        text: message.trim(),
        message_mode: 'external',
      });
      toast.success(t('chat.inbox.message-sent'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('chat.inbox.message-error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-500" />
            {t('chat.inbox.start-conversation')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Lead search */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">{t('chat.inbox.search-lead')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  if (selectedLead) setSelectedLead(null);
                }}
                placeholder={t('chat.inbox.search-lead-placeholder')}
                className="pl-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-md overflow-hidden bg-background shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected lead indicator */}
            {selectedLead && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{selectedLead.first_name} {selectedLead.last_name}</span>
                {selectedLead.phone && (
                  <span className="text-muted-foreground">· {selectedLead.phone}</span>
                )}
              </div>
            )}
          </div>

          {/* Instance select */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">{t('chat.inbox.select-instance')}</label>
            <Select
              value={selectedInstanceId}
              onValueChange={setSelectedInstanceId}
              disabled={loadingInstances}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('chat.inbox.select-instance')} />
              </SelectTrigger>
              <SelectContent>
                {instances.map(inst => (
                  <SelectItem key={inst.id} value={String(inst.id)}>
                    {inst.instance_name.split('_')[0]}
                    <span className={cn(
                      'ml-2 text-xs',
                      inst.status === 'connected' ? 'text-green-500' : 'text-muted-foreground'
                    )}>
                      ({inst.status})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">{t('chat.inbox.contact-message-label')}</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('chat.inbox.contact-message-placeholder')}
              disabled={isSending}
              className="resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!selectedLead || !selectedInstanceId || !message.trim() || isSending}
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCirclePlus className="h-4 w-4" />
            )}
            {t('chat.inbox.contact-send-message')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartConversationModal;
