import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useGoals } from "@/contexts/goals-context";
import { useHabits } from "@/contexts/habits-context";
import { useProjects } from "@/contexts/projects-context";
import { getMemberByName, useSession } from "@/contexts/session-context";
import { useTasks } from "@/contexts/tasks-context";

export default function DashboardScreen() {
  const { member } = useLocalSearchParams<{ member?: string }>();
  const { selectedMember, setSelectedMember } = useSession();
  const { getPersonalScore, getVisibleHabits } = useHabits();
  const {
    getGoalProgressLabel,
    getGoalProgressPercent,
    getPriorityGoals,
  } = useGoals();
  const { getPriorityProjects } = useProjects();
  const { getPriorityTasks } = useTasks();
  const routeMember = getMemberByName(member);
  const activeMember = selectedMember ?? routeMember;
  const visibleHabits = activeMember ? getVisibleHabits(activeMember.name) : [];
  const priorityGoals = activeMember ? getPriorityGoals(activeMember.name) : [];
  const priorityProjects = activeMember
    ? getPriorityProjects(activeMember.name)
    : [];
  const priorityTasks = activeMember ? getPriorityTasks(activeMember.name) : [];
  const personalScore = activeMember ? getPersonalScore(activeMember.name) : 0;

  useEffect(() => {
    if (!selectedMember && routeMember) {
      setSelectedMember(routeMember);
      return;
    }

    if (!activeMember) {
      router.replace("/select-member");
    }
  }, [activeMember, routeMember, selectedMember, setSelectedMember]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
      }}
      contentContainerStyle={{
        padding: 20,
      }}
    >
      {/* Header */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <View>
          <Text
            style={{
              color: "#888",
            }}
          >
            Good Morning
          </Text>

          <Text
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: "700",
              marginTop: 5,
            }}
          >
            {activeMember?.name}
          </Text>

          <Text
            style={{
              color: "#AAA",
              marginTop: 6,
            }}
          >
            {activeMember
              ? `${activeMember.role} \u2022 ${activeMember.skill}`
              : ""}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/more")}
          style={{
            backgroundColor: "#111",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#222",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "700",
            }}
          >
            More
          </Text>
        </Pressable>
      </View>

      {/* Personal Score */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 25,
        }}
      >
        <Text
          style={{
            color: "#888",
          }}
        >
          Personal Score
        </Text>

        <Text
          style={{
            color: "white",
            fontSize: 36,
            fontWeight: "700",
            marginTop: 10,
          }}
        >
          {personalScore} / 100
        </Text>
      </View>

      {/* Team Score */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 15,
        }}
      >
        <Text
          style={{
            color: "#888",
          }}
        >
          CCS Team Score
        </Text>

        <Text
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: "700",
            marginTop: 10,
          }}
        >
          245 / 300
        </Text>
      </View>

      {/* Today's Habits */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Today{"'"}s Habits
        </Text>

        {visibleHabits.length === 0 ? (
          <Text style={{ color: "#AAA", marginTop: 12 }}>
            No habits created yet
          </Text>
        ) : (
          visibleHabits.slice(0, 3).map((habit) => (
            <Text key={habit.id} style={{ color: "#AAA", marginTop: 8 }}>
              {habit.completed ? "\u2611" : "\u25A1"} {habit.title}
            </Text>
          ))
        )}
      </View>

      {/* Priority Goals */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Priority Goals
        </Text>

        {priorityGoals.length === 0 ? (
          <Text style={{ color: "#AAA", marginTop: 12 }}>
            No priority goals yet
          </Text>
        ) : (
          priorityGoals.map((goal) => (
            <Text key={goal.id} style={{ color: "#AAA", marginTop: 8 }}>
              {goal.status === "completed" ? "\u2611" : "\u25A1"} {goal.title}
              {" \u2022 "}
              {getGoalProgressLabel(goal)} ({getGoalProgressPercent(goal)}%)
            </Text>
          ))
        )}
      </View>

      {/* Projects */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Active Projects
        </Text>

        {priorityProjects.length === 0 ? (
          <Text style={{ color: "#AAA", marginTop: 12 }}>
            No active projects yet
          </Text>
        ) : (
          priorityProjects.map((project) => (
            <Text key={project.id} style={{ color: "#AAA", marginTop: 8 }}>
              {project.title}
              {" \u2022 "}
              {project.priority}
              {project.deadline ? ` \u2022 ${project.deadline}` : ""}
            </Text>
          ))
        )}
      </View>

      {/* Priority Tasks */}

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Priority Tasks
        </Text>

        {priorityTasks.length === 0 ? (
          <Text style={{ color: "#AAA", marginTop: 12 }}>
            No priority tasks yet
          </Text>
        ) : (
          priorityTasks.map((task) => (
            <Text key={task.id} style={{ color: "#AAA", marginTop: 8 }}>
              {task.status === "completed" ? "\u2611" : "\u25A1"} {task.title}
              {" \u2022 "}
              {task.priority}
              {task.dueDate ? ` \u2022 ${task.dueDate}` : ""}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}
