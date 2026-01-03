import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TicketPlus, Send, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const OpenTicket: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  const generateTicketCode = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: t('ticket.validation-error'),
        description: t('ticket.fill-required'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const generatedCode = generateTicketCode();

    try {
      const response = await fetch(
        'https://optomyze-n8n.kmfrpu.easypanel.host/webhook/8c5a2509-49cb-4230-9898-81cc5bea5a9c',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_name: user?.name || 'Unknown',
            user_email: user?.email || 'Unknown',
            company: (user as any)?.company_name || 'Unknown',
            subject: subject.trim(),
            message: message.trim(),
            ticket: generatedCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      setTicketCode(generatedCode);
      setSubject('');
      setMessage('');
      
      toast({
        title: t('ticket.success'),
        description: t('ticket.success-desc'),
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({
        title: t('ticket.error'),
        description: t('ticket.error-desc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setTicketCode(null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TicketPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('ticket.title')}</CardTitle>
                <CardDescription>{t('ticket.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Info Notice */}
            <Alert className="bg-muted/50 border-muted-foreground/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm text-muted-foreground">
                {t('ticket.notice')}
              </AlertDescription>
            </Alert>

            {ticketCode ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('ticket.created')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('ticket.contact-soon')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 inline-block">
                  <p className="text-xs text-muted-foreground mb-1">{t('ticket.your-code')}</p>
                  <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {ticketCode}
                  </p>
                </div>
                <Button onClick={handleNewTicket} variant="outline" className="mt-4">
                  {t('ticket.new-ticket')}
                </Button>
              </motion.div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User Info Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('ticket.name')}</Label>
                    <p className="text-sm font-medium text-foreground">{user?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('ticket.email')}</Label>
                    <p className="text-sm font-medium text-foreground">{user?.email || '-'}</p>
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">
                    {t('ticket.subject')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('ticket.subject-placeholder')}
                    maxLength={200}
                    disabled={isSubmitting}
                    className="bg-background"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    {t('ticket.message')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('ticket.message-placeholder')}
                    rows={5}
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="bg-background resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/2000
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('ticket.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('ticket.submit')}
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OpenTicket;
