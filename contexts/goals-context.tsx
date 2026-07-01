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

const GOALS_STORAGE_KEY = "ccs-os:goals:v1";

export type GoalStatus = "active" | "completed" | "archived";
export type GoalPriority = "high" | "medium" | "low";

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  status: GoalStatus;
  priority: GoalPriority;
  targetDate?: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
  createdAt: string;
  completedAt?: string;
};

export type CreateGoalInput = {
  title: string;
  description: string;
  category: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  priority: GoalPriority;
  targetDate?: string;
  sharedWithTeam: boolean;
  createdBy: MemberName;
};

export type EditGoalInput = {
  title: string;
  description: string;
  category: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  priority: GoalPriority;
  targetDate?: string;
  sharedWithTeam: boolean;
};

export type GoalStats = {
  activeCount: number;
  completedCount: number;
  priorityCount: number;
  averageProgress: number;
};

type StoredGoal = Omit<
  Goal,
  "description" | "unit" | "currentValue" | "targetValue" | "priority" | "status"
> & {
  description?: string;
  unit?: string;
  currentValue?: number;
  targetValue?: number;
  priority?: GoalPriority;
  status?: GoalStatus;
  targetDate?: string;
  completedAt?: string;
  progress?: number;
};

type GoalsContextValue = {
  goals: Goal[];
  isLoaded: boolean;
  addGoal: (input: CreateGoalInput) => Promise<void>;
  editGoal: (goalId: string, input: EditGoalInput) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  archiveGoal: (goalId: string) => void;
  toggleGoalStatus: (goalId: string) => void;
  getVisibleGoals: (memberName: MemberName) => Goal[];
  getPriorityGoals: (memberName: MemberName) => Goal[];
  getGoalStats: (memberName: MemberName) => GoalStats;
  getGoalProgressPercent: (goal: Goal) => number;
  getGoalProgressLabel: (goal: Goal) => string;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

const PRIORITY_ORDER: Record<GoalPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getGoalProgressPercent(goal: Goal) {
  if (goal.targetValue <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((goal.currentValue / goal.targetValue) * 100),
  );
}

export function getGoalProgressLabel(goal: Goal) {
  const unitSuffix = goal.unit.trim().length > 0 ? ` ${goal.unit.trim()}` : "";
  return `${goal.currentValue} / ${goal.targetValue}${unitSuffix}`;
}

function isGoalCompleteByValue(goal: Pick<Goal, "currentValue" | "targetValue">) {
  return goal.targetValue > 0 && goal.currentValue >= goal.targetValue;
}

function resolveStatusFromValues(
  goal: Pick<Goal, "currentValue" | "targetValue" | "status">,
  options?: { preferStoredStatus?: boolean },
): GoalStatus {
  if (goal.status === "archived") {
    return "archived";
  }

  if (options?.preferStoredStatus && goal.status === "completed") {
    return "completed";
  }

  if (isGoalCompleteByValue(goal)) {
    return "completed";
  }

  return "active";
}

function normalizeGoal(storedGoal: StoredGoal): Goal {
  const currentValue =
    storedGoal.currentValue ??
    (typeof storedGoal.progress === "number" ? storedGoal.progress : 0);
  const targetValue =
    storedGoal.targetValue ??
    (typeof storedGoal.progress === "number" ? 100 : 1);

  const baseGoal: Goal = {
    ...storedGoal,
    description: storedGoal.description ?? "",
    unit: storedGoal.unit ?? "",
    currentValue,
    targetValue: targetValue > 0 ? targetValue : 1,
    priority: storedGoal.priority ?? "medium",
    status: storedGoal.status ?? "active",
    completedAt: storedGoal.completedAt,
  };

  const status = resolveStatusFromValues(baseGoal, { preferStoredStatus: true });

  return {
    ...baseGoal,
    status,
    completedAt:
      status === "completed"
        ? (storedGoal.completedAt ?? new Date().toISOString())
        : undefined,
  };
}

function sortGoalsByPriority(goals: Goal[]) {
  return [...goals].sort((left, right) => {
    const priorityDifference =
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getVisibleGoalsForMember(goals: Goal[], memberName: MemberName) {
  return sortGoalsByPriority(
    goals.filter(
      (goal) =>
        goal.status !== "archived" &&
        (goal.sharedWithTeam || goal.createdBy === memberName),
    ),
  );
}

function getPriorityGoalsForMember(goals: Goal[], memberName: MemberName) {
  return getVisibleGoalsForMember(goals, memberName)
    .filter((goal) => goal.status === "active" && goal.priority === "high")
    .slice(0, 3);
}

function getGoalStatsForMember(goals: Goal[], memberName: MemberName): GoalStats {
  const visibleGoals = getVisibleGoalsForMember(goals, memberName);
  const activeGoals = visibleGoals.filter((goal) => goal.status === "active");
  const completedGoals = visibleGoals.filter(
    (goal) => goal.status === "completed",
  );
  const priorityGoals = activeGoals.filter((goal) => goal.priority === "high");
  const averageProgress =
    activeGoals.length === 0
      ? 0
      : Math.round(
          activeGoals.reduce(
            (total, goal) => total + getGoalProgressPercent(goal),
            0,
          ) / activeGoals.length,
        );

  return {
    activeCount: activeGoals.length,
    completedCount: completedGoals.length,
    priorityCount: priorityGoals.length,
    averageProgress,
  };
}

function applyInputToGoal(goal: Goal, input: EditGoalInput): Goal {
  const nextGoal: Goal = {
    ...goal,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    unit: input.unit.trim(),
    currentValue: input.currentValue,
    targetValue: input.targetValue,
    priority: input.priority,
    targetDate: input.targetDate?.trim() || undefined,
    sharedWithTeam: input.sharedWithTeam,
    status: goal.status === "archived" ? "archived" : "active",
  };

  const status = resolveStatusFromValues(nextGoal);

  return {
    ...nextGoal,
    status,
    completedAt:
      status === "completed"
        ? (goal.completedAt ?? new Date().toISOString())
        : undefined,
  };
}

export function GoalsProvider({ children }: PropsWithChildren) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadGoals() {
      const storedGoals = await AsyncStorage.getItem(GOALS_STORAGE_KEY);

      if (!storedGoals) {
        setIsLoaded(true);
        return;
      }

      const parsedGoals = JSON.parse(storedGoals) as StoredGoal[];
      setGoals(parsedGoals.map(normalizeGoal));
      setIsLoaded(true);
    }

    loadGoals().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals)).catch(
      () => {},
    );
  }, [goals, isLoaded]);

  const addGoal = useCallback(async (input: CreateGoalInput) => {
    const now = new Date();
    const draftGoal: Goal = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      unit: input.unit.trim(),
      currentValue: input.currentValue,
      targetValue: input.targetValue,
      priority: input.priority,
      targetDate: input.targetDate?.trim() || undefined,
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      createdAt: now.toISOString(),
      status: "active",
    };

    const status = resolveStatusFromValues(draftGoal);
    const newGoal: Goal = {
      ...draftGoal,
      status,
      completedAt: status === "completed" ? now.toISOString() : undefined,
    };

    setGoals((currentGoals) => [...currentGoals, newGoal]);
  }, []);

  const editGoal = useCallback(async (goalId: string, input: EditGoalInput) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        return applyInputToGoal(goal, input);
      }),
    );
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    setGoals((currentGoals) =>
      currentGoals.filter((goal) => goal.id !== goalId),
    );
  }, []);

  const archiveGoal = useCallback((goalId: string) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: "archived",
            }
          : goal,
      ),
    );
  }, []);

  const toggleGoalStatus = useCallback((goalId: string) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id !== goalId || goal.status === "archived") {
          return goal;
        }

        if (goal.status === "completed") {
          return {
            ...goal,
            status: "active",
            completedAt: undefined,
          };
        }

        return {
          ...goal,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      goals,
      isLoaded,
      addGoal,
      editGoal,
      deleteGoal,
      archiveGoal,
      toggleGoalStatus,
      getVisibleGoals: (memberName: MemberName) =>
        getVisibleGoalsForMember(goals, memberName),
      getPriorityGoals: (memberName: MemberName) =>
        getPriorityGoalsForMember(goals, memberName),
      getGoalStats: (memberName: MemberName) =>
        getGoalStatsForMember(goals, memberName),
      getGoalProgressPercent,
      getGoalProgressLabel,
    }),
    [addGoal, archiveGoal, deleteGoal, editGoal, goals, isLoaded, toggleGoalStatus],
  );

  return (
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);

  if (!context) {
    throw new Error("useGoals must be used inside GoalsProvider");
  }

  return context;
}
