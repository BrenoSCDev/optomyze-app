/**
 * OPTOMYZE AGENTS - COMING SOON PAGE
 * 
 * Displays a coming soon interface for the upcoming native AI agents
 * built into Optomyze CRM for lead qualification and engagement.
 */

import { Bot, Sparkles, MessageCircle, Brain, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import OptoIcon from '@/assets/opto-icon.png';

const OptomyzeAgents = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: MessageCircle,
      titleKey: 'agents.optomyze.feature1-title',
      descKey: 'agents.optomyze.feature1-desc',
    },
    {
      icon: Settings2,
      titleKey: 'agents.optomyze.feature2-title',
      descKey: 'agents.optomyze.feature2-desc',
    },
    {
      icon: Brain,
      titleKey: 'agents.optomyze.feature3-title',
      descKey: 'agents.optomyze.feature3-desc',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('agents.optomyze.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('agents.optomyze.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="relative p-8 md:p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <motion.div
                className="relative"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="p-6 rounded-full bg-primary/10 border border-primary/20">
                  <Bot className="h-16 w-16 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
              </motion.div>

              {/* Badge */}
              <Badge variant="outline" className="px-4 py-1 text-sm border-primary/30 text-primary bg-primary/5">
                {t('agents.optomyze.coming-soon-badge')}
              </Badge>

              {/* Title & Description */}
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-3xl font-bold text-foreground">
                  {t('agents.optomyze.headline')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('agents.optomyze.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.titleKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Roadmap Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-dashed border-border/50 bg-muted/30">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">
                {t('agents.optomyze.roadmap-title')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('agents.optomyze.roadmap-desc')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OptomyzeAgents;
