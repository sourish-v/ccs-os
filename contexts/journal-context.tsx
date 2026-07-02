import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { MemberName } from "@/contexts/session-context";

const JOURNAL_STORAGE_KEY = "ccs-os:journal:v1";

export type JournalMood = "Great" | "Good" | "Neutral" | "Bad" | "Terrible";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: JournalMood;
  date: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
  createdAt: string;
};

export type CreateJournalEntryInput = {
  title: string;
  content: string;
  mood: JournalMood;
  date: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
};

export type EditJournalEntryInput = {
  title: string;
  content: string;
  mood: JournalMood;
  date: string;
  sharedWithTeam: boolean;
};

type StoredJournalEntry = JournalEntry & {
  mood?: JournalMood;
};

type JournalContextValue = {
  entries: JournalEntry[];
  isLoaded: boolean;
  addEntry: (input: CreateJournalEntryInput) => Promise<void>;
  editEntry: (
    entryId: string,
    input: EditJournalEntryInput,
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  getVisibleEntries: (memberName: MemberName) => JournalEntry[];
};

const JournalContext = createContext<JournalContextValue | null>(null);

function normalizeEntry(storedEntry: StoredJournalEntry): JournalEntry {
  return {
    ...storedEntry,
    content: storedEntry.content ?? "",
    mood: storedEntry.mood ?? "Neutral",
  };
}

function sortEntries(entries: JournalEntry[]) {
  return [...entries].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getVisibleEntriesForMember(
  entries: JournalEntry[],
  memberName: MemberName,
) {
  return sortEntries(
    entries.filter(
      (entry) => entry.sharedWithTeam || entry.createdBy === memberName,
    ),
  );
}

export function JournalProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      const storedEntries = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);

      if (!storedEntries) {
        setIsLoaded(true);
        return;
      }

      const parsedEntries = JSON.parse(storedEntries) as StoredJournalEntry[];
      setEntries(parsedEntries.map(normalizeEntry));
      setIsLoaded(true);
    }

    loadEntries().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries)).catch(
      () => {},
    );
  }, [entries, isLoaded]);

  const addEntry = useCallback(async (input: CreateJournalEntryInput) => {
    const now = new Date();
    const newEntry: JournalEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      content: input.content.trim(),
      mood: input.mood,
      date: input.date.trim(),
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      createdAt: now.toISOString(),
    };

    setEntries((currentEntries) => [...currentEntries, newEntry]);
  }, []);

  const editEntry = useCallback(
    async (entryId: string, input: EditJournalEntryInput) => {
      setEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                title: input.title.trim(),
                content: input.content.trim(),
                mood: input.mood,
                date: input.date.trim(),
                sharedWithTeam: input.sharedWithTeam,
              }
            : entry,
        ),
      );
    },
    [],
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId),
    );
  }, []);

  const value = useMemo(
    () => ({
      entries,
      isLoaded,
      addEntry,
      editEntry,
      deleteEntry,
      getVisibleEntries: (memberName: MemberName) =>
        getVisibleEntriesForMember(entries, memberName),
    }),
    [addEntry, deleteEntry, editEntry, entries, isLoaded],
  );

  return (
    <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);

  if (!context) {
    throw new Error("useJournal must be used inside JournalProvider");
  }

  return context;
}
