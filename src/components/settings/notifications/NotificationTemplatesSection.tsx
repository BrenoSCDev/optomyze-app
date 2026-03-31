// NotificationTemplatesSection - Coming Soon
// This component is currently commented out in CrmPanel and will be implemented
// when the backend supports notification templates.

import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables: string[];
}

interface Props {
  templates: NotificationTemplate[];
  onUpdate: (templateId: string, updates: Partial<NotificationTemplate>) => void;
  onAdd: (template: Omit<NotificationTemplate, 'id'>) => void;
  onDelete: (templateId: string) => void;
}

export default function NotificationTemplatesSection({ templates, onUpdate, onAdd, onDelete }: Props) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-8 text-muted-foreground">
      {t('common.coming-soon')}
    </div>
  );
}
