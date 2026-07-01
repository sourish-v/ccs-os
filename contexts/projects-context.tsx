
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

const PROJECTS_STORAGE_KEY = "ccs-os:projects:v1";

export type ProjectStatus = "planning" | "active" | "completed" | "archived";

export type ProjectPriority = "high" | "medium" | "low";

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;

  status: ProjectStatus;
  priority: ProjectPriority;

  deadline?: string;

  createdBy: MemberName;
  sharedWithTeam: boolean;

  createdAt: string;
  completedAt?: string;
};

export type CreateProjectInput = {
  title: string;
  description: string;
  category: string;

  priority: ProjectPriority;

  deadline?: string;

  createdBy: MemberName;
  sharedWithTeam: boolean;
};

export type EditProjectInput = {
  title: string;
  description: string;
  category: string;

  priority: ProjectPriority;

  deadline?: string;

  sharedWithTeam: boolean;
};

type StoredProject = Project & {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  completedAt?: string;
};

type ProjectStats = {
  activeCount: number;
  completedCount: number;
  teamProjects: number;
};

type ProjectsContextValue = {
  projects: Project[];
  isLoaded: boolean;

  addProject: (input: CreateProjectInput) => Promise<void>;
  editProject: (projectId: string, input: EditProjectInput) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => void;
  toggleProjectStatus: (projectId: string) => void;

  getVisibleProjects: (memberName: MemberName) => Project[];
  getPriorityProjects: (memberName: MemberName) => Project[];
  getProjectStats: (memberName: MemberName) => ProjectStats;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const PRIORITY_ORDER: Record<ProjectPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function normalizeProject(storedProject: StoredProject): Project {
  return {
    ...storedProject,
    description: storedProject.description ?? "",
    category: storedProject.category ?? "",
    status: storedProject.status ?? "active",
    priority: storedProject.priority ?? "medium",
    completedAt:
      storedProject.status === "completed"
        ? (storedProject.completedAt ?? new Date().toISOString())
        : undefined,
  };
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => {
    const priorityDifference =
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (left.deadline && right.deadline) {
      return left.deadline.localeCompare(right.deadline);
    }

    if (left.deadline) return -1;
    if (right.deadline) return 1;

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getVisibleProjectsForMember(
  projects: Project[],
  memberName: MemberName,
) {
  return sortProjects(
    projects.filter(
      (project) =>
        project.status !== "archived" &&
        (project.sharedWithTeam || project.createdBy === memberName),
    ),
  );
}

function getPriorityProjectsForMember(
  projects: Project[],
  memberName: MemberName,
) {
  return getVisibleProjectsForMember(projects, memberName)
    .filter(
      (project) => project.priority === "high" && project.status === "active",
    )
    .slice(0, 3);
}

function getProjectStatsForMember(
  projects: Project[],
  memberName: MemberName,
): ProjectStats {
  const visibleProjects = getVisibleProjectsForMember(projects, memberName);

  return {
    activeCount: visibleProjects.filter(
      (project) => project.status === "active",
    ).length,

    completedCount: visibleProjects.filter(
      (project) => project.status === "completed",
    ).length,

    teamProjects: visibleProjects.filter((project) => project.sharedWithTeam)
      .length,
  };
}

export function ProjectsProvider({ children }: PropsWithChildren) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      const storedProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects) as StoredProject[];
        setProjects(parsedProjects.map(normalizeProject));
      }

      setIsLoaded(true);
    }

    loadProjects().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects)).catch(
      () => {},
    );
  }, [isLoaded, projects]);

  const addProject = useCallback(async (input: CreateProjectInput) => {
    const now = new Date();
    const newProject: Project = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      status: "active",
      priority: input.priority,
      deadline: input.deadline?.trim() || undefined,
      createdBy: input.createdBy,
      sharedWithTeam: input.sharedWithTeam,
      createdAt: now.toISOString(),
    };

    setProjects((currentProjects) => [...currentProjects, newProject]);
  }, []);

  const editProject = useCallback(
    async (projectId: string, input: EditProjectInput) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                title: input.title.trim(),
                description: input.description.trim(),
                category: input.category.trim(),
                priority: input.priority,
                deadline: input.deadline?.trim() || undefined,
                sharedWithTeam: input.sharedWithTeam,
              }
            : project,
        ),
      );
    },
    [],
  );

  const deleteProject = useCallback(async (projectId: string) => {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId),
    );
  }, []);

  const archiveProject = useCallback((projectId: string) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status: "archived",
            }
          : project,
      ),
    );
  }, []);

  const toggleProjectStatus = useCallback((projectId: string) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId || project.status === "archived") {
          return project;
        }

        if (project.status === "completed") {
          return {
            ...project,
            status: "active",
            completedAt: undefined,
          };
        }

        return {
          ...project,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      projects,
      isLoaded,
      addProject,
      editProject,
      deleteProject,
      archiveProject,
      toggleProjectStatus,
      getVisibleProjects: (memberName: MemberName) =>
        getVisibleProjectsForMember(projects, memberName),
      getPriorityProjects: (memberName: MemberName) =>
        getPriorityProjectsForMember(projects, memberName),
      getProjectStats: (memberName: MemberName) =>
        getProjectStatsForMember(projects, memberName),
    }),
    [
      addProject,
      archiveProject,
      deleteProject,
      editProject,
      isLoaded,
      projects,
      toggleProjectStatus,
    ],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);

  if (!context) {
    throw new Error("useProjects must be used inside ProjectsProvider");
  }

  return context;
}
