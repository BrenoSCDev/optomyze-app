import React from 'react';
import { Shield, Users, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ManageRoles = () => {
  const { t } = useLanguage();

  // Placeholder roles that are typically used in team contexts
  const exampleRoles = [
    { name: 'closer', description: t('roles.examples.closer') },
    { name: 'pre-sales', description: t('roles.examples.pre-sales') },
    { name: 'support', description: t('roles.examples.support') },
    { name: 'coordinator', description: t('roles.examples.coordinator') },
  ];

  return (
    <div className="glass-card p-6 m-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {t('roles.manage.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('roles.manage.description')}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">
              {t('roles.info.title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('roles.info.description')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('roles.examples.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleRoles.map((role) => (
              <div 
                key={role.name} 
                className="flex items-center gap-3 p-4 rounded-lg border bg-card"
              >
                <Badge variant="secondary" className="text-sm">
                  {role.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {role.description}
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
            {t('roles.examples.hint')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageRoles;
