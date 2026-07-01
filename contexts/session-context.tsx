import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type MemberName = "Sourish" | "Chinmay" | "Chanakya";

export type Member = {
  name: MemberName;
  role: string;
  skill: string;
};

export const members: Member[] = [
  {
    name: "Sourish",
    role: "Strategist",
    skill: "Video Editing & Content",
  },
  {
    name: "Chinmay",
    role: "Business & Communication",
    skill: "Design",
  },
  {
    name: "Chanakya",
    role: "Technical Execution",
    skill: "Fitness & Systems",
  },
];

export function getMemberByName(name: string | string[] | undefined) {
  const memberName = Array.isArray(name) ? name[0] : name;

  return members.find((member) => member.name === memberName) ?? null;
}

type SessionContextValue = {
  selectedMember: Member | null;
  setSelectedMember: (member: Member) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const value = useMemo(
    () => ({
      selectedMember,
      setSelectedMember,
      clearSession: () => setSelectedMember(null),
    }),
    [selectedMember],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
