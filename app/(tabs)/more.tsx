import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useGoals } from "@/contexts/goals-context";
import { useHabits } from "@/contexts/habits-context";
import { useProjects } from "@/contexts/projects-context";
import { useSession } from "@/contexts/session-context";
import { useTasks } from "@/contexts/tasks-context";

function showPlaceholderAlert(title: string) {
  Alert.alert(title, "Coming in V1.1");
}

export default function MoreScreen() {
  const { clearSession, selectedMember } = useSession();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  function handleChangeMember() {
    clearSession();
    router.replace("/select-member");
  }

  function handleResetApplication() {
    Alert.alert(
      "Reset CCS OS",
      "This will permanently delete all local application data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Reset Application",
              "Reset functionality will be added in V1.1",
            );
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
      }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 110,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "700",
          marginTop: 40,
        }}
      >
        More
      </Text>

      <Text
        style={{
          color: "#888",
          marginTop: 6,
        }}
      >
        CCS OS control center
      </Text>

      <View style={{ marginTop: 24 }}>
        <Pressable
          onPress={() => router.push("/(tabs)/finance")}
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            Finance
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 8,
            }}
          >
            Coming in V1.1
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/journal")}
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            Journal
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 8,
            }}
          >
            Coming in V1.1
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Account
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "#888", fontSize: 13 }}>Current Member</Text>

          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "700",
              marginTop: 6,
            }}
          >
            {selectedMember?.name ?? "Not Selected"}
          </Text>

          <Text
            style={{
              color: "#AAA",
              marginTop: 8,
            }}
          >
            Member Role: {selectedMember?.role ?? "Choose a member to continue"}
          </Text>

          <Pressable
            onPress={handleChangeMember}
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text
              style={{
                color: "black",
                fontWeight: "700",
              }}
            >
              Change Member
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Application
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            CCS OS
          </Text>

          <Text
            style={{
              color: "#AAA",
              marginTop: 8,
            }}
          >
            Version 1.0.0 {"\u2022"} Build 1
          </Text>

          <Pressable
            onPress={() => showPlaceholderAlert("About CCS OS")}
            style={{
              backgroundColor: "#222",
              padding: 16,
              borderRadius: 14,
              marginTop: 18,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              About CCS OS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => showPlaceholderAlert("GitHub Repository")}
            style={{
              backgroundColor: "#222",
              padding: 16,
              borderRadius: 14,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              GitHub Repository
            </Text>
          </Pressable>

          <Pressable
            onPress={() => showPlaceholderAlert("Release Notes")}
            style={{
              backgroundColor: "#222",
              padding: 16,
              borderRadius: 14,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Release Notes
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Data
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "#888" }}>Coming in V1.1</Text>

          <Pressable
            onPress={() => showPlaceholderAlert("Export Data")}
            style={{
              backgroundColor: "#222",
              padding: 16,
              borderRadius: 14,
              marginTop: 18,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Export Data
            </Text>
          </Pressable>

          <Pressable
            onPress={() => showPlaceholderAlert("Import Data")}
            style={{
              backgroundColor: "#222",
              padding: 16,
              borderRadius: 14,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Import Data
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Developer
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 13 }}>
                Storage Status
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                Local
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 13 }}>Habits</Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                {habits.length}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 18,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 13 }}>Goals</Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                {goals.length}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 13 }}>Projects</Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                {projects.length}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Tasks</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {tasks.length}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Danger Zone
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Pressable
            onPress={handleResetApplication}
            style={{
              backgroundColor: "#331111",
              padding: 16,
              borderRadius: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#552222",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Reset Application
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
