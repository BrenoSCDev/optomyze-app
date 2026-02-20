import React, { useState } from 'react';
import { X, UserPlus, Shield, Users, Loader2, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ChatConversation, ChatContact,
  addGroupMembers, promoteToAdmin,
} from '@/services/inboxChatApi';

interface GroupManagementPanelProps {
  conversation: ChatConversation;
  contacts: ChatContact[];
  onClose: () => void;
  onConversationUpdated: (conv: ChatConversation) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}/${url.replace(/^\//, '')}`;
}

const GroupManagementPanel: React.FC<GroupManagementPanelProps> = ({
  conversation, contacts, onClose, onConversationUpdated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [promotingId, setPromotingId] = useState<number | null>(null);

  const currentUserId = user?.id;
  const me = conversation.participants.find(p => p.id === currentUserId);
  const isAdmin = me?.conversation_role === 'admin';

  const existingIds = new Set(conversation.participants.map(p => p.id));
  const availableContacts = contacts.filter(c => !existingIds.has(c.id));

  const handleAddMembers = async () => {
    if (selectedNewMembers.size === 0 || isAdding) return;
    setIsAdding(true);
    try {
      const updated = await addGroupMembers(conversation.id, Array.from(selectedNewMembers));
      onConversationUpdated(updated);
      setSelectedNewMembers(new Set());
      setShowAddMembers(false);
      toast({ title: 'Members added', description: `${selectedNewMembers.size} member(s) added.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to add members.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handlePromote = async (userId: number) => {
    if (promotingId) return;
    setPromotingId(userId);
    try {
      const updated = await promoteToAdmin(conversation.id, userId);
      onConversationUpdated(updated);
      toast({ title: 'Admin promoted', description: 'User is now a group admin.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to promote admin.', variant: 'destructive' });
    } finally {
      setPromotingId(null);
    }
  };

  const toggleNewMember = (id: number) => {
    setSelectedNewMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground flex-1">Group Members</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Add members button (admin only) */}
      {isAdmin && !showAddMembers && (
        <div className="px-4 py-2 border-b border-border/30">
          <button
            onClick={() => setShowAddMembers(true)}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Members
          </button>
        </div>
      )}

      {/* Add members panel */}
      {showAddMembers && (
        <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Select contacts to add</span>
            <button onClick={() => { setShowAddMembers(false); setSelectedNewMembers(new Set()); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
            {availableContacts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No contacts to add</p>
            ) : (
              availableContacts.map(contact => {
                const picUrl = getAvatarUrl(contact.profile_pic_url);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleNewMember(contact.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-xs
                      ${selectedNewMembers.has(contact.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/40'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {picUrl ? (
                        <img src={picUrl} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-semibold text-primary">{getInitials(contact.name)}</span>
                      )}
                    </div>
                    <span className="truncate text-foreground">{contact.name}</span>
                    <span className="text-muted-foreground ml-auto">{contact.role}</span>
                  </button>
                );
              })
            )}
          </div>
          {selectedNewMembers.size > 0 && (
            <button
              onClick={handleAddMembers}
              disabled={isAdding}
              className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
            >
              {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
              Add {selectedNewMembers.size} member(s)
            </button>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto">
        {conversation.participants.map(participant => {
          const picUrl = getAvatarUrl(participant.profile_pic_url);
          const isMe = participant.id === currentUserId;
          const isParticipantAdmin = participant.conversation_role === 'admin';

          return (
            <div key={participant.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                {picUrl ? (
                  <img src={picUrl} alt={participant.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-semibold text-primary">{getInitials(participant.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{participant.name}</span>
                  {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{participant.role}</span>
                  {isParticipantAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Promote button: only admin can promote members */}
              {isAdmin && !isParticipantAdmin && !isMe && (
                <button
                  onClick={() => handlePromote(participant.id)}
                  disabled={promotingId === participant.id}
                  className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-40 flex items-center gap-1"
                  title="Make Admin"
                >
                  {promotingId === participant.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Shield className="w-3 h-3" />
                  )}
                  Admin
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupManagementPanel;
