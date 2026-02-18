import React, { useState } from 'react';
import { X, Users, ImagePlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_USERS, MOCK_CURRENT_USER_ID, InboxUser } from '@/data/mockInboxData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ open, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const otherUsers = MOCK_USERS.filter(u => u.id !== MOCK_CURRENT_USER_ID);
  const filtered = otherUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    onCreateGroup(groupName.trim(), [MOCK_CURRENT_USER_ID, ...selectedIds]);
    setGroupName('');
    setSelectedIds([]);
    setSearch('');
    onClose();
  };

  const statusDot = (u: InboxUser) => {
    const color = u.status === 'online' ? 'bg-green-500' : u.status === 'away' ? 'bg-yellow-500' : 'bg-muted-foreground';
    return <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${color}`} />;
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Create Group</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Group avatar placeholder */}
              <div className="flex items-center gap-4">
                <button className="w-14 h-14 rounded-xl bg-muted/50 border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-primary">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[9px]">Photo</span>
                </button>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Group Name *</label>
                  <Input
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="e.g. Marketing Team..."
                    className="bg-background/50"
                  />
                </div>
              </div>

              {/* Member search */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Add Members ({selectedIds.length} selected)
                </label>
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="bg-background/50 mb-2"
                />

                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-1">
                  {filtered.map(u => {
                    const selected = selectedIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                          ${selected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-primary">{u.initials}</span>
                          </div>
                          {statusDot(u)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.role}</p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!groupName.trim() || selectedIds.length === 0}
              >
                Create Group
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;
