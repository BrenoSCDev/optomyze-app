import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChatContact } from '@/services/inboxChatApi';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: number[]) => void;
  contacts: ChatContact[];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ open, onClose, onCreateGroup, contacts }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const toggleUser = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    onCreateGroup(groupName.trim(), selectedIds);
    setGroupName('');
    setSelectedIds([]);
    setSearch('');
    onClose();
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-foreground">Create Group</h2>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                    {groupName ? getInitials(groupName) : 'GR'}
                  </div>
                  <Input
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="text-sm"
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-border">
                  {filteredContacts.map(contact => {
                    const isSelected = selectedIds.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => toggleUser(contact.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                          ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {getInitials(contact.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                          <p className="text-[10px] text-muted-foreground">{contact.role}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedIds.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">{selectedIds.length} member(s) selected</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/40 bg-muted/20">
                <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!groupName.trim() || selectedIds.length === 0}
                  className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create Group
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateGroupModal;
