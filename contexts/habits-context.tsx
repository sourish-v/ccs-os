import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

import type { MemberName } from "@/contexts/session-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const HABITS_STORAGE_KEY = "ccs-os:habits:v1";
const NOTIFICATION_CHANNEL_ID = "ccs-habits";

export type HabitFrequency = "daily" | "today";

export type Habit = {
  id: string;
  title: string;
  category: string;
  reminderTime: string;
  completed: boolean;
  streak: number;
  createdBy: MemberName;
  sharedWithTeam: boolean;
  frequency: HabitFrequency;
  completedDates: string[];
  lastResetDate: string;
  notificationId?: string;
};

export type CreateHabitInput = {
  title: string;
  category: string;
  reminderTime: string;
  sharedWithTeam: boolean;
  frequency: HabitFrequency;
  createdBy: MemberName;
};

export type EditHabitInput = {
  title: string;
  category: string;
  reminderTime: string;
  sharedWithTeam: boolean;
  frequency: HabitFrequency;
};

type StoredHabit = Omit<Habit, "frequency"> & {
  frequency?: HabitFrequency;
  completedDates?: string[];
  lastResetDate?: string;
};

type HabitsContextValue = {
  habits: Habit[];
  isLoaded: boolean;
  addHabit: (input: CreateHabitInput) => Promise<void>;
  editHabit: (habitId: string, input: EditHabitInput) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabit: (habitId: string) => void;
  getVisibleHabits: (memberName: MemberName) => Habit[];
  getPersonalScore: (memberName: MemberName) => number;
};

const HabitsContext = createContext<HabitsContextValue | null>(null);

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDateKeyOffset(dateKey: string, offsetDays: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return getTodayKey(date);
}

function calculateStreak(completedDates: string[]) {
  const completed = new Set(completedDates);
  const sortedDates = [...completed].sort();
  const latestDate = sortedDates.at(-1);

  if (!latestDate) {
    return 0;
  }

  let streak = 0;
  let cursor = latestDate;

  while (completed.has(cursor)) {
    streak += 1;
    cursor = getDateKeyOffset(cursor, -1);
  }

  return streak;
}

function normalizeHabit(storedHabit: StoredHabit): Habit {
  const frequency = storedHabit.frequency ?? "daily";
  const completedDates = storedHabit.completedDates ?? [];

  return {
    ...storedHabit,
    frequency,
    completedDates,
    lastResetDate: storedHabit.lastResetDate ?? getTodayKey(),
    streak: frequency === "daily" ? calculateStreak(completedDates) : 0,
  };
}

function resetHabitForToday(habit: Habit, todayKey = getTodayKey()) {
  if (habit.frequency === "today") {
    return habit.lastResetDate === todayKey ? habit : null;
  }

  if (habit.lastResetDate === todayKey) {
    return habit;
  }

  return {
    ...habit,
    completed: false,
    lastResetDate: todayKey,
    streak: calculateStreak(habit.completedDates),
  };
}

function resetHabitsForToday(habits: Habit[], todayKey = getTodayKey()) {
  return habits.flatMap((habit) => {
    const resetHabit = resetHabitForToday(habit, todayKey);
    return resetHabit ? [resetHabit] : [];
  });
}

function getVisibleHabitsForMember(habits: Habit[], memberName: MemberName) {
  return habits.filter(
    (habit) => habit.sharedWithTeam || habit.createdBy === memberName,
  );
}

function parseReminderTime(reminderTime: string) {
  const [hourText, minuteText] = reminderTime.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

async function ensureNotificationPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Habit reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();

  if (existingPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.granted;
}

async function cancelHabitNotification(notificationId: string | undefined) {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

async function scheduleHabitNotification(habit: Habit) {
  const reminder = parseReminderTime(habit.reminderTime);

  if (!reminder) {
    return undefined;
  }

  const hasPermission = await ensureNotificationPermissions();

  if (!hasPermission) {
    return undefined;
  }

  if (habit.frequency === "today") {
    const triggerDate = new Date();
    triggerDate.setHours(reminder.hour, reminder.minute, 0, 0);

    if (triggerDate.getTime() <= Date.now()) {
      return undefined;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: habit.title,
        body: `Time for ${habit.category}`,
        data: {
          habitId: habit.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: NOTIFICATION_CHANNEL_ID,
        date: triggerDate,
      },
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: habit.title,
      body: `Time for ${habit.category}`,
      data: {
        habitId: habit.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: NOTIFICATION_CHANNEL_ID,
      hour: reminder.hour,
      minute: reminder.minute,
    },
  });
}

function applyFrequencyToCompletion(
  habit: Habit,
  frequency: HabitFrequency,
): Pick<Habit, "completedDates" | "streak" | "lastResetDate"> {
  const todayKey = getTodayKey();
  const completedDates = habit.completed ? [todayKey] : [];

  if (frequency === "today") {
    return {
      completedDates,
      streak: 0,
      lastResetDate: todayKey,
    };
  }

  return {
    completedDates,
    streak: calculateStreak(completedDates),
    lastResetDate: todayKey,
  };
}

export function HabitsProvider({ children }: PropsWithChildren) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadHabits() {
      const storedHabits = await AsyncStorage.getItem(HABITS_STORAGE_KEY);

      if (!storedHabits) {
        setIsLoaded(true);
        return;
      }

      const parsedHabits = JSON.parse(storedHabits).map((habit: Habit) => ({
        ...habit,
        frequency: habit.frequency ?? "daily",
      }));
      setHabits(resetHabitsForToday(parsedHabits.map(normalizeHabit)));
      setIsLoaded(true);
    }

    loadHabits().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits)).catch(
      () => {},
    );
  }, [habits, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const intervalId = setInterval(() => {
      setHabits((currentHabits) => resetHabitsForToday(currentHabits));
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isLoaded]);

  const addHabit = useCallback(async (input: CreateHabitInput) => {
    const now = new Date();
    const todayKey = getTodayKey(now);
    const newHabit: Habit = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      category: input.category.trim(),
      reminderTime: input.reminderTime,
      completed: false,
      streak: 0,
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      frequency: input.frequency,
      completedDates: [],
      lastResetDate: todayKey,
    };

    const notificationId = await scheduleHabitNotification(newHabit);

    setHabits((currentHabits) => [
      ...currentHabits,
      {
        ...newHabit,
        notificationId,
      },
    ]);
  }, []);

  const editHabit = useCallback(
    async (habitId: string, input: EditHabitInput) => {
      const existingHabit = habits.find((habit) => habit.id === habitId);

      if (!existingHabit) {
        return;
      }

      await cancelHabitNotification(existingHabit.notificationId);

      const frequencyState =
        existingHabit.frequency === input.frequency
          ? {
              completedDates: existingHabit.completedDates,
              streak:
                input.frequency === "daily"
                  ? calculateStreak(existingHabit.completedDates)
                  : 0,
              lastResetDate: existingHabit.lastResetDate,
            }
          : applyFrequencyToCompletion(existingHabit, input.frequency);

      const editedHabit: Habit = {
        ...existingHabit,
        title: input.title.trim(),
        category: input.category.trim(),
        reminderTime: input.reminderTime,
        sharedWithTeam: input.sharedWithTeam,
        frequency: input.frequency,
        notificationId: undefined,
        ...frequencyState,
      };

      const notificationId = await scheduleHabitNotification(editedHabit);

      setHabits((currentHabits) =>
        currentHabits.map((habit) =>
          habit.id === habitId
            ? {
                ...editedHabit,
                notificationId,
              }
            : habit,
        ),
      );
    },
    [habits],
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      const existingHabit = habits.find((habit) => habit.id === habitId);

      if (existingHabit) {
        await cancelHabitNotification(existingHabit.notificationId);
      }

      setHabits((currentHabits) =>
        currentHabits.filter((habit) => habit.id !== habitId),
      );
    },
    [habits],
  );

  const toggleHabit = useCallback((habitId: string) => {
    const todayKey = getTodayKey();

    setHabits((currentHabits) =>
      currentHabits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const resetHabit = resetHabitForToday(habit, todayKey);

        if (!resetHabit) {
          return habit;
        }

        if (resetHabit.frequency === "today") {
          return {
            ...resetHabit,
            completed: !resetHabit.completed,
            completedDates: !resetHabit.completed ? [todayKey] : [],
            streak: 0,
          };
        }

        const completedDates = new Set(resetHabit.completedDates);

        if (resetHabit.completed) {
          completedDates.delete(todayKey);
        } else {
          completedDates.add(todayKey);
        }

        const nextCompletedDates = [...completedDates].sort();

        return {
          ...resetHabit,
          completed: !resetHabit.completed,
          completedDates: nextCompletedDates,
          streak: calculateStreak(nextCompletedDates),
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      habits,
      isLoaded,
      addHabit,
      editHabit,
      deleteHabit,
      toggleHabit,
      getVisibleHabits: (memberName: MemberName) =>
        getVisibleHabitsForMember(habits, memberName),
      getPersonalScore: (memberName: MemberName) => {
        const visibleHabits = getVisibleHabitsForMember(habits, memberName);

        if (visibleHabits.length === 0) {
          return 0;
        }

        const completedHabits = visibleHabits.filter(
          (habit) => habit.completed,
        );

        return Math.round(
          (completedHabits.length / visibleHabits.length) * 100,
        );
      },
    }),
    [addHabit, deleteHabit, editHabit, habits, isLoaded, toggleHabit],
  );

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);

  if (!context) {
    throw new Error("useHabits must be used inside HabitsProvider");
  }

  return context;
}
