/**
 * CONTACT MESSAGE COMPONENT
 * 
 * Renders a shared WhatsApp contact card with name, phone, and "Start Chat" action.
 */

import React, { useState } from 'react';
import { User, Phone, MessageSquare, Loader2, Info, Send } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ContactMessageProps {
  contactName: string;
  contactPhone: string;
  isOutgoing: boolean;
  instanceId?: number;
}

const ContactMessage: React.FC<ContactMessageProps> = ({
  contactName,
  contactPhone,
  isOutgoing,
  instanceId,
}) => {
  const { t } = useLanguage();
  const [showStartChat, setShowStartChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const formatPhone = (phone: string) => {
    if (phone.startsWith('+')) return phone;
    return phone;
  };

  const handleStartChat = async () => {
    if (!messageText.trim()) return;
    
    setIsSending(true);
    try {
      // TODO: Call the send-to-contact endpoint once the route is specified
      console.log('Start chat with:', { contactPhone, message: messageText, instanceId });
      
      setShowStartChat(false);
      setMessageText('');
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="space-y-2 min-w-[200px]">
        {/* Contact card */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            isOutgoing ? "bg-green-400/30" : "bg-muted"
          )}>
            <User className={cn("h-5 w-5", isOutgoing ? "text-white" : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-semibold truncate",
              isOutgoing ? "text-white" : "text-foreground"
            )}>
              {contactName}
            </p>
            <div className="flex items-center gap-1">
              <Phone className={cn("h-3 w-3", isOutgoing ? "text-green-100" : "text-muted-foreground")} />
              <span className={cn(
                "text-xs",
                isOutgoing ? "text-green-100" : "text-muted-foreground"
              )}>
                {formatPhone(contactPhone)}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={cn("border-t", isOutgoing ? "border-green-400/30" : "border-border/50")} />

        {/* Start Chat button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowStartChat(true)}
          className={cn(
            "w-full gap-2 text-xs font-medium h-8",
            isOutgoing 
              ? "text-white hover:bg-green-400/20" 
              : "text-primary hover:bg-accent"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {t('chat.inbox.contact-start-chat')}
        </Button>
      </div>

      {/* Start Chat Modal */}
      <Dialog open={showStartChat} onOpenChange={setShowStartChat}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaWhatsapp className="h-5 w-5 text-green-500" />
              {t('chat.inbox.contact-start-chat')}
            </DialogTitle>
            <DialogDescription>
              {t('chat.inbox.contact-modal-description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('chat.inbox.contact-name')}</Label>
                <Input value={contactName} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('chat.inbox.contact-phone')}</Label>
                <Input value={formatPhone(contactPhone)} readOnly className="bg-muted/50" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('chat.inbox.contact-message-label')}</Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('chat.inbox.contact-message-placeholder')}
                rows={3}
                className="resize-none"
              />
            </div>

            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs text-muted-foreground">
                {t('chat.inbox.contact-new-lead-notice')}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowStartChat(false)} disabled={isSending}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleStartChat}
              disabled={!messageText.trim() || isSending}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('chat.inbox.contact-send-message')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactMessage;
