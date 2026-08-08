import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import DocumentsBoard from './DocumentsBoard';
import TemplateEditor from './TemplateEditor';
import DocumentDetailSheet from './DocumentDetailSheet';
import type { DocumentRecord } from '@/services/documentsApi';
import { LayoutGrid, FileCode } from 'lucide-react';

/**
 * The Documents module.
 *
 * Contracts are the first document type, not the whole module — proposals,
 * quotes and NDAs are the same board and the same templates, distinguished
 * only by their type.
 */
const DocumentsModule: React.FC = () => {
  const { t } = useLanguage();
  const [openDocument, setOpenDocument] = useState<DocumentRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-xl font-semibold">{t('nav.documents')}</h1>
        <p className="text-sm text-muted-foreground">{t('documents.module.subtitle')}</p>
      </div>

      <Tabs defaultValue="board">
        <TabsList className="mb-4">
          <TabsTrigger value="board" className="gap-2 text-xs">
            <LayoutGrid className="h-4 w-4" />
            {t('documents.module.board')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 text-xs">
            <FileCode className="h-4 w-4" />
            {t('documents.module.templates')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-0">
          <DocumentsBoard key={refreshKey} onOpenDocument={setOpenDocument} />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <TemplateEditor />
        </TabsContent>
      </Tabs>

      <DocumentDetailSheet
        documentId={openDocument?.id ?? null}
        onOpenChange={(open) => !open && setOpenDocument(null)}
        onChanged={() => setRefreshKey((key) => key + 1)}
      />
    </motion.div>
  );
};

export default DocumentsModule;
