'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Child } from '@/types';
import { fetchChildrenForUser } from '@/lib/services/children-service';
import { getCurrentUser, watchAuthState } from '@/lib/services/auth-service';

const ACTIVE_CHILD_STORAGE_KEY = 'tinysteps_active_child_id';

type ActiveChildContextValue = {
  childrenList: Child[];
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
  loading: boolean;
  refreshChildren: () => Promise<void>;
};

const ActiveChildContext = createContext<ActiveChildContextValue | null>(null);

export function ActiveChildProvider({ children }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshChildren = useCallback(async () => {
    const user = getCurrentUser();

    if (!user) {
      setChildrenList([]);
      setActiveChildIdState(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextChildren = await fetchChildrenForUser(user.uid);

      setChildrenList(nextChildren);

      const savedChildId = window.localStorage.getItem(ACTIVE_CHILD_STORAGE_KEY);
      const nextActiveChildId =
        nextChildren.find((child) => child.id === activeChildId)?.id ??
        nextChildren.find((child) => child.id === savedChildId)?.id ??
        nextChildren[0]?.id ??
        null;

      setActiveChildIdState(nextActiveChildId);
    } finally {
      setLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      if (!user) {
        setChildrenList([]);
        setActiveChildIdState(null);
        setLoading(false);
        return;
      }

      await refreshChildren();
    });

    return unsubscribe;
  }, [refreshChildren]);

  useEffect(() => {
    if (!activeChildId) {
      window.localStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ACTIVE_CHILD_STORAGE_KEY, activeChildId);
  }, [activeChildId]);

  const value = useMemo(
    () => ({
      childrenList,
      activeChildId,
      setActiveChildId: setActiveChildIdState,
      loading,
      refreshChildren,
    }),
    [activeChildId, childrenList, loading, refreshChildren],
  );

  return (
    <ActiveChildContext.Provider value={value}>
      {children}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild() {
  const context = useContext(ActiveChildContext);

  if (!context) {
    throw new Error('useActiveChild must be used within ActiveChildProvider.');
  }

  return context;
}
