/**
 * Authentication Editor Component
 * Handles different authentication types
 */

import React from 'react';
import { Key, Lock, User, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AuthType, ApiRequest } from './types';

interface AuthEditorProps {
  authType: AuthType;
  authConfig: ApiRequest['authConfig'];
  onAuthTypeChange: (type: AuthType) => void;
  onAuthConfigChange: (config: ApiRequest['authConfig']) => void;
}

export const AuthEditor: React.FC<AuthEditorProps> = ({
  authType,
  authConfig,
  onAuthTypeChange,
  onAuthConfigChange,
}) => {
  const authTypes = [
    { value: 'none', label: 'No Auth', icon: Shield },
    { value: 'bearer', label: 'Bearer Token', icon: Key },
    { value: 'api-key', label: 'API Key', icon: Lock },
    { value: 'basic', label: 'Basic Auth', icon: User },
    { value: 'oauth2', label: 'OAuth 2.0', icon: Shield },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {authTypes.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => onAuthTypeChange(type.value as AuthType)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                authType === type.value
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
        {authType === 'none' && (
          <p className="text-sm text-muted-foreground text-center py-4">
            This request does not use any authentication
          </p>
        )}

        {authType === 'bearer' && (
          <div className="space-y-2">
            <Label htmlFor="bearer-token" className="text-sm">Token</Label>
            <Input
              id="bearer-token"
              value={authConfig.bearerToken || ''}
              onChange={(e) => onAuthConfigChange({ ...authConfig, bearerToken: e.target.value })}
              placeholder="Enter bearer token"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The token will be sent as: Authorization: Bearer &lt;token&gt;
            </p>
          </div>
        )}

        {authType === 'api-key' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Add to</Label>
              <RadioGroup
                value={authConfig.apiKeyLocation || 'header'}
                onValueChange={(v) => onAuthConfigChange({ ...authConfig, apiKeyLocation: v as 'header' | 'query' })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="header" id="loc-header" />
                  <Label htmlFor="loc-header" className="text-sm font-normal">Header</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="query" id="loc-query" />
                  <Label htmlFor="loc-query" className="text-sm font-normal">Query Params</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-header" className="text-sm">Key</Label>
                <Input
                  id="api-key-header"
                  value={authConfig.apiKeyHeader || ''}
                  onChange={(e) => onAuthConfigChange({ ...authConfig, apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-value" className="text-sm">Value</Label>
                <Input
                  id="api-key-value"
                  value={authConfig.apiKeyValue || ''}
                  onChange={(e) => onAuthConfigChange({ ...authConfig, apiKeyValue: e.target.value })}
                  placeholder="Enter API key"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {authType === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic-username" className="text-sm">Username</Label>
              <Input
                id="basic-username"
                value={authConfig.basicUsername || ''}
                onChange={(e) => onAuthConfigChange({ ...authConfig, basicUsername: e.target.value })}
                placeholder="Username"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-password" className="text-sm">Password</Label>
              <Input
                id="basic-password"
                type="password"
                value={authConfig.basicPassword || ''}
                onChange={(e) => onAuthConfigChange({ ...authConfig, basicPassword: e.target.value })}
                placeholder="Password"
                className="text-sm"
              />
            </div>
          </div>
        )}

        {authType === 'oauth2' && (
          <div className="text-center py-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              OAuth 2.0 configuration coming soon
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Support for authorization code, client credentials, and other flows
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
