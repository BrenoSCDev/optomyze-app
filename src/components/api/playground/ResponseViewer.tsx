/**
 * Response Viewer Component
 * Displays API response with formatting and details
 */

import React, { useState } from 'react';
import { Clock, Database, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiResponse, STATUS_COLORS } from './types';

interface ResponseViewerProps {
  response: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  isLoading,
  error,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('body');

  const copyToClipboard = async () => {
    if (response?.body) {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusColor = (status: number): string => {
    const firstDigit = String(status)[0];
    return STATUS_COLORS[firstDigit] || 'text-muted-foreground bg-muted/50';
  };

  const formatBody = (body: string): string => {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-border/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-primary rounded-full animate-spin border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">{t('api.playground.response.sending')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-500/10 rounded-lg border border-red-500/30">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-red-400 font-medium">{t('api.playground.response.failed')}</p>
          <p className="text-xs text-red-400/70 mt-1 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed border-border/50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('api.playground.response.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg border border-border/50">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{response.time}ms</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>{formatSize(response.size)}</span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              {t('api.playground.response.copied')}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              {t('api.playground.response.copy')}
            </>
          )}
        </Button>
      </div>

      {/* Response Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30">
          <TabsTrigger value="body">{t('api.playground.response.body')}</TabsTrigger>
          <TabsTrigger value="headers">
            {t('api.playground.response.headers')} ({Object.keys(response.headers).length})
          </TabsTrigger>
          <TabsTrigger value="raw">{t('api.playground.response.raw')}</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="mt-4">
          <ScrollArea className="h-[300px] rounded-lg border border-border/50 bg-muted/10">
            <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
              {formatBody(response.body)}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="mt-4">
          <ScrollArea className="h-[300px] rounded-lg border border-border/50 bg-muted/10">
            <div className="p-4 space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="font-mono text-primary font-medium">{key}:</span>
                  <span className="font-mono text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <ScrollArea className="h-[300px] rounded-lg border border-border/50 bg-muted/10">
            <pre className="p-4 text-sm font-mono text-muted-foreground whitespace-pre-wrap">
              {response.body}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
