'use client';
import { Card, Button, Input } from '@/components/UI';
import { Users, Share2, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Invite, Child } from '@/types';

interface CaregiverInvitesProps {
  activeChild: Child;
  invites: Invite[];
  onSendInvite: (email: string) => void;
  onDeclineInvite: (id: string) => void;
  onBack: () => void;
}

export const CaregiverInvites = ({
  activeChild,
  invites,
  onSendInvite,
  onDeclineInvite,
  onBack,
}: CaregiverInvitesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" onClick={onBack} className="px-3 py-2">
          <ChevronRight size={20} className="rotate-180" />
        </Button>
        <h2 className="serif text-3xl font-semibold">Caregivers</h2>
      </div>

      <Card>
        <h3 className="text-sm font-bold uppercase tracking-widest text-black/30 mb-4">
          Invite Caregiver
        </h3>
        <p className="text-xs text-black/40 mb-4 leading-relaxed">
          Share {activeChild.name}&apos;s profile with a partner, grandparent, or
          nanny. They will be able to view and log activities.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSendInvite(formData.get('email') as string);
            (e.target as HTMLFormElement).reset();
          }}
          className="space-y-4"
        >
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="caregiver@example.com"
          />
          <Button className="w-full flex items-center justify-center gap-2">
            <Share2 size={18} />
            Send Invitation
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-black/30 ml-1">
          Pending Invitations
        </h3>
        {invites
          .filter((i) => i.childId === activeChild.id && i.status === 'pending')
          .map((i) => (
            <Card key={i.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Users size={18} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold">{i.inviteeEmail}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">
                    Invited by {i.inviterEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="p-2 text-red-500"
                  onClick={() => onDeclineInvite(i.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            </Card>
          ))}
        {invites.filter(
          (i) => i.childId === activeChild.id && i.status === 'pending',
        ).length === 0 && (
          <p className="text-center text-black/30 py-8 italic">
            No pending invitations.
          </p>
        )}
      </div>
    </motion.div>
  );
};
