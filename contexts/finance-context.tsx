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

const FINANCE_STORAGE_KEY = "ccs-os:finance:v1";

export type FinanceType = "income" | "expense";

export type FinanceEntry = {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: FinanceType;
  date: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
  createdAt: string;
};

export type CreateFinanceEntryInput = {
  title: string;
  amount: number;
  category: string;
  type: FinanceType;
  date: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
};

export type EditFinanceEntryInput = {
  title: string;
  amount: number;
  category: string;
  type: FinanceType;
  date: string;
  sharedWithTeam: boolean;
};

type StoredFinanceEntry = FinanceEntry & {
  amount?: number;
  type?: FinanceType;
};

type FinanceStats = {
  income: number;
  expenses: number;
  currentBalance: number;
};

type FinanceContextValue = {
  entries: FinanceEntry[];
  isLoaded: boolean;
  addEntry: (input: CreateFinanceEntryInput) => Promise<void>;
  editEntry: (
    entryId: string,
    input: EditFinanceEntryInput,
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  getVisibleEntries: (memberName: MemberName) => FinanceEntry[];
  getFinanceStats: (memberName: MemberName) => FinanceStats;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function normalizeEntry(storedEntry: StoredFinanceEntry): FinanceEntry {
  return {
    ...storedEntry,
    amount: storedEntry.amount ?? 0,
    category: storedEntry.category ?? "",
    type: storedEntry.type ?? "expense",
  };
}

function sortEntries(entries: FinanceEntry[]) {
  return [...entries].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getVisibleEntriesForMember(
  entries: FinanceEntry[],
  memberName: MemberName,
) {
  return sortEntries(
    entries.filter(
      (entry) => entry.sharedWithTeam || entry.createdBy === memberName,
    ),
  );
}

function getFinanceStatsForMember(
  entries: FinanceEntry[],
  memberName: MemberName,
): FinanceStats {
  const visibleEntries = getVisibleEntriesForMember(entries, memberName);
  const income = visibleEntries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expenses = visibleEntries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);

  return {
    income,
    expenses,
    currentBalance: income - expenses,
  };
}

export function FinanceProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      const storedEntries = await AsyncStorage.getItem(FINANCE_STORAGE_KEY);

      if (!storedEntries) {
        setIsLoaded(true);
        return;
      }

      const parsedEntries = JSON.parse(storedEntries) as StoredFinanceEntry[];
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

    AsyncStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(entries)).catch(
      () => {},
    );
  }, [entries, isLoaded]);

  const addEntry = useCallback(async (input: CreateFinanceEntryInput) => {
    const now = new Date();
    const newEntry: FinanceEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      amount: input.amount,
      category: input.category.trim(),
      type: input.type,
      date: input.date.trim(),
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      createdAt: now.toISOString(),
    };

    setEntries((currentEntries) => [...currentEntries, newEntry]);
  }, []);

  const editEntry = useCallback(
    async (entryId: string, input: EditFinanceEntryInput) => {
      setEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                title: input.title.trim(),
                amount: input.amount,
                category: input.category.trim(),
                type: input.type,
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
      getFinanceStats: (memberName: MemberName) =>
        getFinanceStatsForMember(entries, memberName),
    }),
    [addEntry, deleteEntry, editEntry, entries, isLoaded],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }

  return context;
}
