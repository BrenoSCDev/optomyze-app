/**
 * WHATSAPP INBOX COMPONENT
 * 
 * Provides WhatsApp inbox management with:
 * - Chat conversation interface
 * - Message management
 * - Coming soon content for future WhatsApp features
 * - Glassmorphism design with modern UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, MessageSquare, FileText, Phone, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppInbox = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          {t('chat.whatsapp.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('chat.whatsapp.description')}
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
              <FaWhatsapp  className="h-5 w-5 text-green-600" />
              {t('chat.whatsapp.title')}
            </CardTitle>
            <CardDescription>
              {t('chat.whatsapp.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coming Soon Content */}
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FaWhatsapp  className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('chat.whatsapp.coming-soon')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('chat.whatsapp.coming-soon-description')}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Feature in Development
              </Badge>
            </div>

            {/* Preview Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('chat.whatsapp.conversations')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  View and manage all conversations
                </p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('chat.whatsapp.messages')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send and receive messages
                </p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('chat.whatsapp.contacts')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage contact database
                </p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('chat.whatsapp.templates')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create message templates
                </p>
              </div>
            </div>

            {/* Mock Chat Interface Preview */}
            <div className="opacity-50 border border-dashed border-muted-foreground/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Chat Interface Preview</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">Hello! How can I help you today?</p>
                    <span className="text-xs text-muted-foreground">10:30 AM</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">I'm interested in your services</p>
                    <span className="text-xs text-muted-foreground">10:32 AM</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">Great! Let me share some information with you.</p>
                    <span className="text-xs text-muted-foreground">10:33 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WhatsAppInbox;