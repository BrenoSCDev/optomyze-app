import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';

interface Execution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf: string | null;
  retrySuccessId: string | null;
  status: string;
  startedAt: string;
  stoppedAt: string;
  workflowId: string;
  waitTill: string | null;
}

interface ExecutionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  executions: Execution[];
  agentName: string;
  isLoading: boolean;
}

const ExecutionsModal: React.FC<ExecutionsModalProps> = ({
  isOpen,
  onClose,
  executions,
  agentName,
  isLoading,
}) => {
  const getStatusIcon = (status: string, finished: boolean) => {
    if (!finished) {
      return <Play className="w-4 h-4 text-blue-500" />;
    }
    
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, finished: boolean) => {
    if (!finished) {
      return <Badge variant="secondary" className="text-blue-600 bg-blue-50">Running</Badge>;
    }
    
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="text-emerald-600 bg-emerald-50">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-yellow-600 bg-yellow-50">Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string, stoppedAt: string) => {
    const start = new Date(startedAt);
    const stop = new Date(stoppedAt);
    const duration = stop.getTime() - start.getTime();
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Execution History - {agentName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading executions...</p>
              </div>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Executions Found</h3>
              <p className="text-muted-foreground">This agent hasn't been executed yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="glass-card p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status, execution.finished)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">#{execution.id}</span>
                          {getStatusBadge(execution.status, execution.finished)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Mode: <span className="font-medium capitalize">{execution.mode}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Started: {formatDateTime(execution.startedAt)}</div>
                      {execution.finished && execution.stoppedAt && (
                        <div>Duration: {formatDuration(execution.startedAt, execution.stoppedAt)}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Workflow ID</div>
                      <div className="font-mono bg-muted/30 p-1 rounded text-xs truncate">
                        {execution.workflowId}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Started At</div>
                      <div className="font-mono text-xs">
                        {new Date(execution.startedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-muted-foreground">
                        {execution.finished ? 'Stopped At' : 'Status'}
                      </div>
                      <div className="font-mono text-xs">
                        {execution.finished 
                          ? new Date(execution.stoppedAt).toLocaleTimeString()
                          : 'Running...'
                        }
                      </div>
                    </div>
                  </div>

                  {execution.retryOf && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Retry of execution #{execution.retryOf}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExecutionsModal;