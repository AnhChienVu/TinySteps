'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Baby,
  Calendar,
  Camera,
  Mail,
  PencilLine,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/UI';
import LogoutButton from '@/components/LogoutButton';
import { useActiveChild } from '@/components/ActiveChildProvider';
import { getCurrentUser } from '@/lib/services/auth-service';
import {
  deleteChildProfileWithData,
  updateChildProfile,
} from '@/lib/services/children-service';

export default function SettingsPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading, refreshChildren } =
    useActiveChild();
  const activeChild = useMemo(
    () => childrenList.find((child) => child.id === activeChildId) ?? null,
    [activeChildId, childrenList],
  );
  const currentUser = getCurrentUser();
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setChildName(activeChild?.name ?? '');
    setBirthDate(activeChild?.birthDate ?? '');
    setNotes(activeChild?.notes ?? '');
    setIsEditingChild(false);
  }, [activeChild]);

  async function handleSaveChild() {
    if (!activeChild) {
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await updateChildProfile(activeChild.id, {
        name: childName.trim(),
        birthDate,
        notes: notes.trim(),
      });
      await refreshChildren();
      setIsEditingChild(false);
      setSuccessMessage('Child profile updated.');
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save child changes right now.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteChild() {
    if (!activeChild) {
      return;
    }

    const didConfirm = window.confirm(
      `Delete ${activeChild.name}'s profile? This cannot be undone.`,
    );

    if (!didConfirm) {
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsDeleting(true);

    try {
      await deleteChildProfileWithData(activeChild.id);
      await refreshChildren();
      router.replace('/dashboard');
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this child profile right now.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md text-center">Loading settings...</Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                <User size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                  Settings
                </p>
                <h2 className="serif text-3xl font-semibold text-black">
                  Account and family
                </h2>
                <p className="text-sm text-black/50">
                  Manage your account, active child, and app shortcuts in one place.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/60 sm:inline-flex"
            >
              Dashboard
            </Link>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm text-green-600">{successMessage}</p>
          ) : null}
        </Card>

        <div className="mx-auto grid max-w-4xl gap-4">
          <Card className="space-y-5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              Your Profile
            </p>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-olive/10 text-olive">
                {currentUser?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName ?? 'User'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User size={28} />
                )}
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black/45 shadow-sm">
                  <Camera size={12} />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-black">
                  {currentUser?.displayName || 'Parent'}
                </h3>
                <p className="flex items-center gap-1 text-sm text-black/45">
                  <Mail size={12} />
                  {currentUser?.email || 'No email available'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-olive/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-olive">
                  <Shield size={10} />
                  Parent
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                  Child Profile
                </p>
                <p className="text-sm text-black/45">
                  Update the currently selected child.
                </p>
              </div>
              {activeChild ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-2"
                  onClick={() => setIsEditingChild((current) => !current)}
                >
                  <PencilLine size={16} />
                </Button>
              ) : null}
            </div>

            {!activeChild ? (
              <div className="rounded-3xl bg-warm-bg px-4 py-5 text-sm text-black/50">
                Select or create a child profile to manage family settings.
              </div>
            ) : isEditingChild ? (
              <div className="space-y-4">
                <Input
                  label="Child Name"
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                />
                <Input
                  label="Birth Date"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
                <Input
                  label="Notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything caregivers should know?"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setChildName(activeChild.name);
                      setBirthDate(activeChild.birthDate);
                      setNotes(activeChild.notes ?? '');
                      setIsEditingChild(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleSaveChild}
                    disabled={isSaving || childName.trim().length === 0}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save size={16} />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <Baby size={30} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-black">
                    {activeChild.name}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-black/45">
                    <Calendar size={12} />
                    Born {activeChild.birthDate}
                  </p>
                  <p className="mt-2 text-sm text-black/50">
                    {activeChild.notes || 'No notes saved yet.'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {activeChild && currentUser?.uid === activeChild.ownerId ? (
            <Card className="space-y-4 border-red-100 bg-red-50/40 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
                    Danger Zone
                  </p>
                  <p className="mt-1 text-sm text-red-900/70">
                    Delete this child profile and remove the known related logs and invites.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteChild}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : `Delete ${activeChild.name}`}
                </Button>
              </div>
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              Session
            </p>
            <p className="text-sm text-black/50">
              Sign out of TinySteps on this device.
            </p>
            <LogoutButton />
          </Card>
        </div>
      </motion.div>
    </main>
  );
}
