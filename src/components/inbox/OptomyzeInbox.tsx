import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareDot } from 'lucide-react';
import { InboxConversation, MOCK_CONVERSATIONS } from '@/data/mockInboxData';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import CreateGroupModal from './CreateGroupModal';
import optoIcon from '@/assets/opto-icon.png';

type MobileView = 'list' | 'thread';

const OptomyzeInbox: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSelectConversation = (conv: InboxConversation) => {
    setSelectedConversation(conv);
    setMobileView('thread');
  };

  const handleCreateGroup = (name: string, memberIds: string[]) => {
    // In real implementation: POST to API
    console.log('Create group:', { name, memberIds });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm shadow-xl">
      {/* Top header bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-background/60 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <img src={optoIcon} alt="Optomyze" className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Optomyze Inbox</h1>
          <p className="text-xs text-muted-foreground">Internal team messaging</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Desktop: side-by-side */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-72 lg:w-80 border-r border-border/40 shrink-0 overflow-hidden">
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onOpenCreateGroup={() => setShowCreateGroup(true)}
            />
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden">
            <MessageThread conversation={selectedConversation} />
          </div>
        </div>

        {/* Mobile: single column with animation */}
        <div className="flex md:hidden flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {mobileView === 'list' && (
              <motion.div
                key="list"
                className="w-full overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ConversationList
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  onOpenCreateGroup={() => setShowCreateGroup(true)}
                />
              </motion.div>
            )}

            {mobileView === 'thread' && (
              <motion.div
                key="thread"
                className="w-full overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <MessageThread
                  conversation={selectedConversation}
                  onBack={() => setMobileView('list')}
                  showBackButton
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default OptomyzeInbox;
