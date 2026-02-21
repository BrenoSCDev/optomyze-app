/**
 * INTERACTIVE API DOCUMENTATION COMPONENT
 * 
 * Provides comprehensive API documentation and testing interface with:
 * - Interactive endpoint testing (similar to Swagger UI)
 * - Live API calls with authentication
 * - Parameter documentation and examples
 * - Response display with status codes
 * - Glassmorphism design with modern UI
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  AlertTriangle, 
  Play,
  Code,
  Key,
  Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEndpointCategories, EndpointDefinition, EndpointParam } from './apiEndpointData';

// Parameter Row Component
const ParameterRow = ({ name, type, required, description, constraints }: EndpointParam & { constraints?: string }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/10 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-primary font-mono text-sm">{name}</code>
          <span className="text-xs text-muted-foreground">({type})</span>
          {required && (
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
              {t('api.required')}
            </span>
          )}
          {constraints && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              {constraints}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  );
};

// API Endpoint Card Component
const APIEndpointCard = ({ endpoint, apiToken, isSelected, onToggle }: {
  endpoint: EndpointDefinition;
  apiToken: string;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const { t } = useLanguage();
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({});

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-600 text-blue-100',
      POST: 'bg-green-600 text-green-100',
      PUT: 'bg-yellow-600 text-yellow-100',
      DELETE: 'bg-red-600 text-red-100'
    };
    return colors[method] || 'bg-secondary text-secondary-foreground';
  };

  const buildUrl = () => {
    let path = endpoint.path;
    if (endpoint.pathParams) {
      for (const param of endpoint.pathParams) {
        path = path.replace(`{${param.name}}`, pathParamValues[param.name] || `{${param.name}}`);
      }
    }
    return path;
  };

  const executeRequest = async () => {
    if (!apiToken) {
      alert(t('api.token-required-alert'));
      return;
    }

    setLoading(true);
    try {
      let body = null;
      if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && requestBody) {
        body = JSON.parse(requestBody);
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
      const url = buildUrl();
      const resp = await axios({
        method: endpoint.method.toLowerCase(),
        url: `${API_BASE_URL}/api/v1${url}`,
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        data: body
      });

      setResponse({
        status: resp.status,
        data: resp.data,
        headers: resp.headers
      });

    } catch (error: any) {
      setResponse({
        status: error.response?.status || 0,
        data: error.response?.data || { error: error.message },
        headers: error.response?.headers || {}
      });
    } finally {
      setLoading(false);
    }
  };

  const hasBody = endpoint.method === 'POST' || endpoint.method === 'PUT';

  return (
    <Card className="glass-card overflow-hidden">
      {/* Endpoint Header */}
      <div 
        className="p-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${getMethodColor(endpoint.method)}`}>
              {endpoint.method}
            </span>
            <code className="text-foreground font-mono">{endpoint.path}</code>
            <span className="text-muted-foreground">{endpoint.summary}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      {isSelected && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-foreground font-semibold mb-2">{t('api.description')}</h4>
            <p className="text-muted-foreground">{endpoint.description}</p>
          </div>

          {/* Path Parameters */}
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div>
              <h4 className="text-foreground font-semibold mb-2">{t('api.path-parameters')}</h4>
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2 text-sm">
                  {endpoint.pathParams.map((p) => (
                    <div key={p.name} className="space-y-2">
                      <ParameterRow {...p} />
                      <input
                        type="text"
                        placeholder={`Enter ${p.name}...`}
                        value={pathParamValues[p.name] || ''}
                        onChange={(e) => setPathParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                        className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Query Parameters */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <h4 className="text-foreground font-semibold mb-2">{t('api.query-parameters')}</h4>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h5 className="text-primary font-medium mb-3">{t('api.available-parameters')}</h5>
                  <div className="space-y-2 text-sm">
                    {endpoint.queryParams.map((p) => (
                      <ParameterRow key={p.name} {...p} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Request Body (for POST/PUT) */}
          {hasBody && endpoint.bodyParams && (
            <div>
              <h4 className="text-foreground font-semibold mb-2">{t('api.request-body')}</h4>
              <div className="space-y-4">
                {/* Parameters Documentation */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h5 className="text-primary font-medium mb-3">{t('api.available-parameters')}</h5>
                    <div className="space-y-2 text-sm">
                      {endpoint.bodyParams.map((p) => (
                        <ParameterRow key={p.name} {...p} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Example Request */}
                {endpoint.exampleBody && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-foreground font-medium">{t('api.example-request')}</h5>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestBody(JSON.stringify(endpoint.exampleBody, null, 2))}
                      >
                        {t('api.use-example')}
                      </Button>
                    </div>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={t('api.json-placeholder')}
                      className="w-full h-64 p-4 rounded-lg bg-muted/50 border border-border text-foreground font-mono text-sm focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Example Responses (static documentation) */}
          {endpoint.exampleResponses && endpoint.exampleResponses.length > 0 && (
            <div>
              <h4 className="text-foreground font-semibold mb-2">{t('api.example-response')}</h4>
              <div className="space-y-3">
                {endpoint.exampleResponses.map((er, idx) => (
                  <Card key={idx} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          er.status >= 200 && er.status < 300
                            ? 'bg-green-600 text-green-100'
                            : er.status >= 400 && er.status < 500
                            ? 'bg-red-600 text-red-100'
                            : 'bg-yellow-600 text-yellow-100'
                        }`}>
                          {er.label}
                        </span>
                      </div>
                      <pre className="text-sm text-foreground overflow-x-auto">
                        {JSON.stringify(er.body, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Try It Out Button */}
          <div className="flex gap-3">
            <Button
              onClick={executeRequest}
              disabled={loading || !apiToken}
              className={`
                flex items-center gap-2
                ${apiToken 
                  ? '' 
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('api.testing')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t('api.try-it-out')}
                </>
              )}
            </Button>
            
            {response && (
              <Button
                variant="outline"
                onClick={() => setResponse(null)}
              >
                {t('api.clear-response')}
              </Button>
            )}
          </div>

          {/* Live Response */}
          {response && (
            <div>
              <h4 className="text-foreground font-semibold mb-2">{t('api.response')}</h4>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      response.status >= 200 && response.status < 300 
                        ? 'bg-green-600 text-green-100' 
                        : 'bg-red-600 text-red-100'
                    }`}>
                      {response.status}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {response.status >= 200 && response.status < 300 ? t('api.success') : t('api.error')}
                    </span>
                  </div>
                  
                  <pre className="text-sm text-foreground overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const ApiSetup = () => {
  const { t } = useLanguage();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState('');
  
  const categories = getEndpointCategories(t);

  // Get API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
  const API_FULL_URL = `${API_BASE_URL}/api/v1`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
          <span>{t('api.api')}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{t('api.setup')}</span>
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {t('api.title')}
        </h1>
        
        {/* Base URL Display */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t('api.base-url')}
                </h3>
                <code className="text-primary text-lg font-mono">
                  {API_FULL_URL}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(API_FULL_URL)}
                title={t('api.copy-base-url')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Info */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-1">{t('api.auth-required')}</h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
                  {t('api.auth-description')}
                </p>
                <code className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                  Authorization: Bearer {'<api_token>'}
                </code>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-2">
                  {t('api.generate-token-hint')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Token Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {t('api.token-testing')}
            </h3>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder={t('api.token-placeholder')}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <Button
                variant="outline"
                onClick={() => setApiToken('')}
              >
                {t('api.clear')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {categories.map((category) => (
          <div key={category.categoryKey} className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code className="h-6 w-6 text-primary" />
              {category.categoryKey}
            </h2>
            
            {category.endpoints.map((endpoint) => (
              <APIEndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                apiToken={apiToken}
                isSelected={selectedEndpoint === endpoint.id}
                onToggle={() => setSelectedEndpoint(
                  selectedEndpoint === endpoint.id ? null : endpoint.id
                )}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ApiSetup;
