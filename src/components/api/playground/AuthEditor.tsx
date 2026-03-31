/**
 * Authentication Editor Component
 * Handles different authentication types
 */

import React from 'react';
import { Key, Lock, User, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();

  const authTypes = [
    { value: 'none', label: t('api.playground.auth.none'), icon: Shield },
    { value: 'bearer', label: t('api.playground.auth.bearer'), icon: Key },
    { value: 'api-key', label: t('api.playground.auth.api-key'), icon: Lock },
    { value: 'basic', label: t('api.playground.auth.basic'), icon: User },
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
            {t('api.playground.auth.no-auth-desc')}
          </p>
        )}

        {authType === 'bearer' && (
          <div className="space-y-2">
            <Label htmlFor="bearer-token" className="text-sm">{t('api.playground.auth.token')}</Label>
            <Input
              id="bearer-token"
              value={authConfig.bearerToken || ''}
              onChange={(e) => onAuthConfigChange({ ...authConfig, bearerToken: e.target.value })}
              placeholder={t('api.playground.auth.enter-token')}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t('api.playground.auth.bearer-hint')}
            </p>
          </div>
        )}

        {authType === 'api-key' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('api.playground.auth.add-to')}</Label>
              <RadioGroup
                value={authConfig.apiKeyLocation || 'header'}
                onValueChange={(v) => onAuthConfigChange({ ...authConfig, apiKeyLocation: v as 'header' | 'query' })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="header" id="loc-header" />
                  <Label htmlFor="loc-header" className="text-sm font-normal">{t('api.playground.auth.header')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="query" id="loc-query" />
                  <Label htmlFor="loc-query" className="text-sm font-normal">{t('api.playground.auth.query-params')}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-header" className="text-sm">{t('api.playground.auth.key')}</Label>
                <Input
                  id="api-key-header"
                  value={authConfig.apiKeyHeader || ''}
                  onChange={(e) => onAuthConfigChange({ ...authConfig, apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-value" className="text-sm">{t('api.playground.value')}</Label>
                <Input
                  id="api-key-value"
                  value={authConfig.apiKeyValue || ''}
                  onChange={(e) => onAuthConfigChange({ ...authConfig, apiKeyValue: e.target.value })}
                  placeholder={t('api.playground.auth.enter-api-key')}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {authType === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic-username" className="text-sm">{t('api.playground.auth.username')}</Label>
              <Input
                id="basic-username"
                value={authConfig.basicUsername || ''}
                onChange={(e) => onAuthConfigChange({ ...authConfig, basicUsername: e.target.value })}
                placeholder={t('api.playground.auth.username')}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-password" className="text-sm">{t('api.playground.auth.password')}</Label>
              <Input
                id="basic-password"
                type="password"
                value={authConfig.basicPassword || ''}
                onChange={(e) => onAuthConfigChange({ ...authConfig, basicPassword: e.target.value })}
                placeholder={t('api.playground.auth.password')}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {authType === 'oauth2' && (
          <div className="text-center py-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('api.playground.auth.oauth-coming-soon')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('api.playground.auth.oauth-desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
