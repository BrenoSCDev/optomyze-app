import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Bot, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: number;
  company_id: number;
  n8n_integration_id: number;
  workflow_id: string;
  workflow_name: string;
  platform: string;
  agent_name: string;
  description: string | null;
  configuration: string;
  webhook_data: string | null;
  status: string;
  last_execution_at: string | null;
  last_execution_result: string | null;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: number;
  lead_id: number;
  n8n_agent_id: number;
  platform: string;
  content: string;
  created_at: string;
  updated_at: string;
  agent: Agent;
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
  leadName: string;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, reports, leadName }) => {
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());

  const toggleReportExpansion = (reportId: number) => {
    setExpandedReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'inactive':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return '💬';
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      default:
        return '🤖';
    }
  };

  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            Conversation Reports - {leadName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {sortedReports.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Reports Available</h3>
              <p className="text-gray-400">
                No conversation reports have been generated for this lead yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-lg border border-white/10 p-6 hover:bg-white/10 transition-colors"
                >
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPlatformIcon(report.platform)}</span>
                        <div>
                          <h4 className="text-white font-semibold">
                            {report.agent ? report.agent.agent_name : 'External Integration'}
                          </h4>
                          {report.agent && (
                            <p className="text-gray-400 text-sm">
                              {report.agent.workflow_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(report.created_at)}
                    </div>
                  </div>

                  {/* Agent Information */}
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="text-xs font-medium border bg-primary/20 text-primary border-primary/30">
                      {report.platform}
                    </Badge>
                    {report.agent && (
                      <>
                        <Badge className={`text-xs font-medium border ${getStatusColor(report.agent.status)}`}>
                          {report.agent.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Zap className="w-3 h-3" />
                          <span>Executions: {report.agent.execution_count}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Report Content */}
                  <div className="bg-black/20 rounded-lg border border-white/5">
                    <div className="p-4">
                      <h5 className="text-white font-medium mb-2">Report Content:</h5>
                      <motion.div
                        initial={false}
                        animate={{
                          height: expandedReports.has(report.id) ? 'auto' : '120px'
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden relative"
                      >
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {report.content}
                        </div>
                        {!expandedReports.has(report.id) && (
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* See More/Less Button */}
                    {report.content.length > 200 && (
                      <div className="border-t border-white/5 px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReportExpansion(report.id)}
                          className="w-full text-primary hover:text-primary/80 hover:bg-white/5 transition-colors"
                        >
                          {expandedReports.has(report.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              See Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              See More
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Additional Agent Details */}
                  {report.agent?.description && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h6 className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                        Agent Description
                      </h6>
                      <p className="text-gray-300 text-sm">
                        {report.agent.description}
                      </p>
                    </div>
                  )}

                  {/* Workflow ID */}
                  {report.agent && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span>Workflow ID:</span>
                      <code className="bg-black/30 px-2 py-1 rounded text-gray-300">
                        {report.agent.workflow_id}
                      </code>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReportsModal;