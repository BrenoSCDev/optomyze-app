/**
 * API Playground Component
 * A Postman-like API testing tool for CRM automations and integrations
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Save, 
  Settings2, 
  History, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { KeyValueEditor } from './KeyValueEditor';
import { RequestBodyEditor } from './RequestBodyEditor';
import { AuthEditor } from './AuthEditor';
import { ResponseViewer } from './ResponseViewer';
import { HistoryPanel } from './HistoryPanel';
import { CrmVariablesPopover } from './CrmVariablesPopover';
import {
  ApiRequest,
  ApiResponse,
  Collection,
  HttpMethod,
  Environment,
  HTTP_METHODS,
  METHOD_COLORS,
  ENVIRONMENT_URLS,
  HEADER_PRESETS,
  createEmptyRequest,
  generateId,
} from './types';

const ApiPlayground: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Request State
  const [currentRequest, setCurrentRequest] = useState<ApiRequest>(createEmptyRequest());
  const [environment, setEnvironment] = useState<Environment>('dev');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History & Collections
  const [history, setHistory] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('headers');

  // Update request field
  const updateRequest = useCallback(<K extends keyof ApiRequest>(
    field: K,
    value: ApiRequest[K]
  ) => {
    setCurrentRequest(prev => ({ ...prev, [field]: value }));
  }, []);

  // Replace variables in URL and body
  const replaceVariables = (text: string): string => {
    let result = text;
    result = result.replace(/\{\{base_url\}\}/g, ENVIRONMENT_URLS[environment]);
    // Additional variable replacement would happen here with real data
    return result;
  };

  // Build full URL with query params
  const buildFullUrl = (): string => {
    let url = replaceVariables(currentRequest.url);
    const enabledParams = currentRequest.queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const queryString = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(replaceVariables(p.value))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    return url;
  };

  // Mock API response for demo
  const generateMockResponse = (): ApiResponse => {
    const mockResponses: ApiResponse[] = [
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateId(),
          'X-Response-Time': `${Math.floor(Math.random() * 100 + 50)}ms`,
        },
        body: JSON.stringify({
          success: true,
          data: {
            id: generateId(),
            message: 'Request processed successfully',
            timestamp: new Date().toISOString(),
            environment: environment,
          },
        }, null, 2),
        time: Math.floor(Math.random() * 300 + 100),
        size: Math.floor(Math.random() * 1000 + 200),
      },
      {
        status: 201,
        statusText: 'Created',
        headers: {
          'Content-Type': 'application/json',
          'Location': `/api/resources/${generateId()}`,
        },
        body: JSON.stringify({
          success: true,
          created: true,
          id: generateId(),
        }, null, 2),
        time: Math.floor(Math.random() * 200 + 150),
        size: Math.floor(Math.random() * 500 + 100),
      },
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: ['Invalid field format', 'Missing required field'],
        }, null, 2),
        time: Math.floor(Math.random() * 100 + 50),
        size: Math.floor(Math.random() * 300 + 100),
      },
    ];

    // Weight towards successful responses
    const weights = [0.6, 0.25, 0.15];
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return mockResponses[i];
    }
    return mockResponses[0];
  };

  // Send request
  const sendRequest = async () => {
    if (!currentRequest.url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a request URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Add to history
    const requestWithTimestamp: ApiRequest = {
      ...currentRequest,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [requestWithTimestamp, ...prev.slice(0, 49)]);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    try {
      // Generate mock response
      const mockResponse = generateMockResponse();
      setResponse(mockResponse);
    } catch (err) {
      setError('Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // History & Collection handlers
  const handleSelectRequest = (request: ApiRequest) => {
    setCurrentRequest({ ...request, id: generateId() });
    setResponse(null);
    setError(null);
  };

  const handleDuplicateRequest = (request: ApiRequest) => {
    setCurrentRequest({
      ...request,
      id: generateId(),
      name: `${request.name} (Copy)`,
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Request history has been cleared',
    });
  };

  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: generateId(),
      name,
      requests: [],
    };
    setCollections(prev => [...prev, newCollection]);
    toast({
      title: 'Collection Created',
      description: `Created collection "${name}"`,
    });
  };

  const handleAddToCollection = (collectionId: string, request: ApiRequest) => {
    setCollections(prev =>
      prev.map(col =>
        col.id === collectionId
          ? { ...col, requests: [...col.requests, { ...request, id: generateId() }] }
          : col
      )
    );
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(col => col.id !== collectionId));
  };

  const handleInsertVariable = (variable: string) => {
    // Insert at cursor position in URL field
    const urlInput = document.querySelector('input[data-url-input]') as HTMLInputElement;
    if (urlInput) {
      const start = urlInput.selectionStart || 0;
      const end = urlInput.selectionEnd || 0;
      const newUrl = currentRequest.url.slice(0, start) + variable + currentRequest.url.slice(end);
      updateRequest('url', newUrl);
    } else {
      updateRequest('url', currentRequest.url + variable);
    }
  };

  const handleClearRequest = () => {
    setCurrentRequest(createEmptyRequest());
    setResponse(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('api.playground.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('api.playground.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={environment} onValueChange={(v) => setEnvironment(v as Environment)}>
            <SelectTrigger className="w-36 h-9">
              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
          >
            {showHistoryPanel ? <ChevronRight className="h-4 w-4" /> : <History className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4">
        {/* Request Builder */}
        <div className={`flex-1 space-y-4 transition-all duration-300 ${showHistoryPanel ? 'pr-0' : ''}`}>
          {/* URL Bar */}
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {/* Method Selector */}
                <Select
                  value={currentRequest.method}
                  onValueChange={(v) => updateRequest('method', v as HttpMethod)}
                >
                  <SelectTrigger className={`w-28 h-10 font-bold border ${METHOD_COLORS[currentRequest.method]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map(method => (
                      <SelectItem key={method} value={method} className="font-bold">
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* URL Input */}
                <div className="flex-1 relative">
                  <Input
                    data-url-input
                    value={currentRequest.url}
                    onChange={(e) => updateRequest('url', e.target.value)}
                    placeholder="Enter request URL or paste text"
                    className="h-10 font-mono text-sm pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <CrmVariablesPopover onInsert={handleInsertVariable} />
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={sendRequest}
                  disabled={isLoading}
                  className="h-10 px-6 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={handleClearRequest}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview URL */}
              {currentRequest.url && (
                <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
                  {buildFullUrl()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Configuration Tabs */}
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted/30 mb-4">
                  <TabsTrigger value="headers">
                    Headers
                    {currentRequest.headers.filter(h => h.enabled).length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">
                        {currentRequest.headers.filter(h => h.enabled).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="params">
                    Params
                    {currentRequest.queryParams.filter(p => p.enabled).length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">
                        {currentRequest.queryParams.filter(p => p.enabled).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>

                <TabsContent value="headers" className="mt-0">
                  <KeyValueEditor
                    items={currentRequest.headers}
                    onChange={(items) => updateRequest('headers', items)}
                    keyPlaceholder="Header name"
                    valuePlaceholder="Value"
                    showPresets
                    presets={HEADER_PRESETS}
                  />
                </TabsContent>

                <TabsContent value="params" className="mt-0">
                  <KeyValueEditor
                    items={currentRequest.queryParams}
                    onChange={(items) => updateRequest('queryParams', items)}
                    keyPlaceholder="Parameter name"
                    valuePlaceholder="Value"
                  />
                </TabsContent>

                <TabsContent value="body" className="mt-0">
                  <RequestBodyEditor
                    bodyType={currentRequest.bodyType}
                    body={currentRequest.body}
                    onBodyTypeChange={(type) => updateRequest('bodyType', type)}
                    onBodyChange={(body) => updateRequest('body', body)}
                  />
                </TabsContent>

                <TabsContent value="auth" className="mt-0">
                  <AuthEditor
                    authType={currentRequest.authType}
                    authConfig={currentRequest.authConfig}
                    onAuthTypeChange={(type) => updateRequest('authType', type)}
                    onAuthConfigChange={(config) => updateRequest('authConfig', config)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Response Viewer */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('api.playground.response')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseViewer
                response={response}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
          </Card>
        </div>

        {/* History Panel */}
        {showHistoryPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-72 flex-shrink-0"
          >
            <Card className="glass-card border-border/50 h-[calc(100vh-12rem)] overflow-hidden">
              <HistoryPanel
                history={history}
                collections={collections}
                onSelectRequest={handleSelectRequest}
                onDuplicateRequest={handleDuplicateRequest}
                onClearHistory={handleClearHistory}
                onCreateCollection={handleCreateCollection}
                onAddToCollection={handleAddToCollection}
                onDeleteCollection={handleDeleteCollection}
              />
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ApiPlayground;
