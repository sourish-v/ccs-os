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

const TASKS_STORAGE_KEY = "ccs-os:tasks:v1";

export type TaskStatus = "pending" | "completed" | "archived";

export type TaskPriority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
  createdAt: string;
  completedAt?: string;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  dueDate?: string;
  createdBy: MemberName;
  sharedWithTeam: boolean;
};

export type EditTaskInput = {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  dueDate?: string;
  sharedWithTeam: boolean;
};

type StoredTask = Task & {
  status?: TaskStatus;
  priority?: TaskPriority;
  completedAt?: string;
};

type TaskStats = {
  pendingCount: number;
  completedCount: number;
  teamTasks: number;
};

type TasksContextValue = {
  tasks: Task[];
  isLoaded: boolean;
  addTask: (input: CreateTaskInput) => Promise<void>;
  editTask: (taskId: string, input: EditTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  archiveTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  getVisibleTasks: (memberName: MemberName) => Task[];
  getPriorityTasks: (memberName: MemberName) => Task[];
  getTaskStats: (memberName: MemberName) => TaskStats;
};

const TasksContext = createContext<TasksContextValue | null>(null);

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function normalizeTask(storedTask: StoredTask): Task {
  return {
    ...storedTask,
    description: storedTask.description ?? "",
    category: storedTask.category ?? "",
    status: storedTask.status ?? "pending",
    priority: storedTask.priority ?? "medium",
    completedAt:
      storedTask.status === "completed"
        ? (storedTask.completedAt ?? new Date().toISOString())
        : undefined,
  };
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const priorityDifference =
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (left.dueDate && right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate) return -1;
    if (right.dueDate) return 1;

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getVisibleTasksForMember(tasks: Task[], memberName: MemberName) {
  return sortTasks(
    tasks.filter(
      (task) =>
        task.status !== "archived" &&
        (task.sharedWithTeam || task.createdBy === memberName),
    ),
  );
}

function getPriorityTasksForMember(tasks: Task[], memberName: MemberName) {
  return getVisibleTasksForMember(tasks, memberName)
    .filter((task) => task.priority === "high" && task.status === "pending")
    .slice(0, 3);
}

function getTaskStatsForMember(
  tasks: Task[],
  memberName: MemberName,
): TaskStats {
  const visibleTasks = getVisibleTasksForMember(tasks, memberName);

  return {
    pendingCount: visibleTasks.filter((task) => task.status === "pending")
      .length,

    completedCount: visibleTasks.filter((task) => task.status === "completed")
      .length,

    teamTasks: visibleTasks.filter((task) => task.sharedWithTeam).length,
  };
}

export function TasksProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

      if (!storedTasks) {
        setIsLoaded(true);
        return;
      }

      const parsedTasks = JSON.parse(storedTasks) as StoredTask[];
      setTasks(parsedTasks.map(normalizeTask));
      setIsLoaded(true);
    }

    loadTasks().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)).catch(
      () => {},
    );
  }, [isLoaded, tasks]);

  const addTask = useCallback(async (input: CreateTaskInput) => {
    const now = new Date();
    const newTask: Task = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      priority: input.priority,
      status: "pending",
      dueDate: input.dueDate?.trim() || undefined,
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      createdAt: now.toISOString(),
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
  }, []);

  const editTask = useCallback(async (taskId: string, input: EditTaskInput) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title: input.title.trim(),
              description: input.description.trim(),
              category: input.category.trim(),
              priority: input.priority,
              dueDate: input.dueDate?.trim() || undefined,
              sharedWithTeam: input.sharedWithTeam,
            }
          : task,
      ),
    );
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }, []);

  const archiveTask = useCallback((taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "archived",
            }
          : task,
      ),
    );
  }, []);

  const toggleTaskStatus = useCallback((taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId || task.status === "archived") {
          return task;
        }

        if (task.status === "completed") {
          return {
            ...task,
            status: "pending",
            completedAt: undefined,
          };
        }

        return {
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      isLoaded,
      addTask,
      editTask,
      deleteTask,
      archiveTask,
      toggleTaskStatus,
      getVisibleTasks: (memberName: MemberName) =>
        getVisibleTasksForMember(tasks, memberName),
      getPriorityTasks: (memberName: MemberName) =>
        getPriorityTasksForMember(tasks, memberName),
      getTaskStats: (memberName: MemberName) =>
        getTaskStatsForMember(tasks, memberName),
    }),
    [
      addTask,
      archiveTask,
      deleteTask,
      editTask,
      isLoaded,
      tasks,
      toggleTaskStatus,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error("useTasks must be used inside TasksProvider");
  }

  return context;
}
