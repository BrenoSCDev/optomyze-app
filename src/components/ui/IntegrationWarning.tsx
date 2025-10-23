import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface IntegrationWarningProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  iconColor?: string;
}

export const IntegrationWarning = ({
  title,
  description,
  buttonText,
  onButtonClick,
  iconColor = "text-destructive"
}: IntegrationWarningProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md p-8 text-center space-y-6">
        <div className={`w-16 h-16 bg-${iconColor.replace('text-', '')}/10 rounded-full flex items-center justify-center mx-auto`}>
          <AlertCircle className={`w-8 h-8 ${iconColor}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={onButtonClick}
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      </Card>
    </div>
  );
};
