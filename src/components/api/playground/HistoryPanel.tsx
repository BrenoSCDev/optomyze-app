/**
 * History Panel Component
 * Shows request history and collections
 */

import React, { useState } from 'react';
import { Clock, Folder, FolderPlus, Play, Copy, Trash2, ChevronRight, ChevronDown, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiRequest, Collection, METHOD_COLORS, REQUEST_TEMPLATES, generateId } from './types';

interface HistoryPanelProps {
  history: ApiRequest[];
  collections: Collection[];
  onSelectRequest: (request: ApiRequest) => void;
  onDuplicateRequest: (request: ApiRequest) => void;
  onClearHistory: () => void;
  onCreateCollection: (name: string) => void;
  onAddToCollection: (collectionId: string, request: ApiRequest) => void;
  onDeleteCollection: (collectionId: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  collections,
  onSelectRequest,
  onDuplicateRequest,
  onClearHistory,
  onCreateCollection,
  onAddToCollection,
  onDeleteCollection,
}) => {
  const { t, language } = useLanguage();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
    }
  };

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'pt-BR' ? 'pt-BR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-card/50 border-l border-border/50">
      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none bg-muted/30 border-b border-border/50">
          <TabsTrigger value="history" className="flex-1 text-xs">{t('api.playground.panel.history')}</TabsTrigger>
          <TabsTrigger value="collections" className="flex-1 text-xs">{t('api.playground.panel.collections')}</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 text-xs">{t('api.playground.panel.templates')}</TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={onClearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t('api.playground.history.clear')}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('api.playground.history.empty')}
                </div>
              ) : (
                history.map((request) => (
                  <div
                    key={request.id}
                    className="group p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelectRequest(request)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHOD_COLORS[request.method]}`}>
                        {request.method}
                      </span>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {request.url || t('api.playground.no-url')}
                      </span>
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                        {formatTimestamp(request.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(request);
                        }}
                      >
                        <Play className="h-2.5 w-2.5 mr-0.5" />
                        {t('api.playground.actions.run')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateRequest(request);
                        }}
                      >
                        <Copy className="h-2.5 w-2.5 mr-0.5" />
                        {t('api.playground.actions.duplicate')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="flex-1 m-0 overflow-hidden">
          <div className="p-2 border-b border-border/50 space-y-2">
            <div className="flex gap-2">
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t('api.playground.collections.name-placeholder')}
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {collections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('api.playground.collections.empty')}
                </div>
              ) : (
                collections.map((collection) => (
                  <div key={collection.id} className="space-y-1">
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors group"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {expandedCollections.includes(collection.id) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <Folder className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs flex-1">{collection.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {collection.requests.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCollection(collection.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {expandedCollections.includes(collection.id) && (
                      <div className="ml-6 space-y-1">
                        {collection.requests.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground px-2 py-1">
                            {t('api.playground.collections.no-requests')}
                          </p>
                        ) : (
                          collection.requests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => onSelectRequest(request)}
                            >
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHOD_COLORS[request.method]}`}>
                                {request.method}
                              </span>
                              <span className="text-xs truncate">{request.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-muted-foreground px-2 mb-2">
                {t('api.playground.templates.description')}
              </p>
              {REQUEST_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="group p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectRequest(template)}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{template.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHOD_COLORS[template.method]}`}>
                      {template.method}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {template.url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
