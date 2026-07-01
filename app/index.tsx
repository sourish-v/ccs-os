import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function CommandCenterScreen() {
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

      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "700",
          marginTop: 40,
        }}
      >
        HELLO COMMAND CENTER
      </Text>

      <Text
        style={{
          color: "#888",
          marginTop: 6,
        }}
      >
        Core Control System
      </Text>

      {/* Team Score */}

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
            fontSize: 14,
          }}
        >
          CCS Team Score
        </Text>

        <Text
          style={{
            color: "white",
            fontSize: 36,
            fontWeight: "700",
            marginTop: 10,
          }}
        >
          245 / 300
        </Text>
      </View>

      {/* Members */}

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
          Members
        </Text>

        <Text style={{ color: "#AAA", marginTop: 12 }}>Sourish — 82</Text>

        <Text style={{ color: "#AAA", marginTop: 8 }}>Chinmay — 77</Text>

        <Text style={{ color: "#AAA", marginTop: 8 }}>Chanakya — 86</Text>
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

        <Text style={{ color: "#AAA", marginTop: 12 }}>Project AURA</Text>

        <Text style={{ color: "#AAA", marginTop: 8 }}>Digital Agency</Text>

        <Text style={{ color: "#AAA", marginTop: 8 }}>Bharat Odyssey</Text>
      </View>

      {/* Current Phase */}

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
          Current Phase
        </Text>

        <Text style={{ color: "#AAA", marginTop: 12 }}>Phase 0</Text>

        <Text style={{ color: "#AAA", marginTop: 8 }}>
          Foundation (2025–2026)
        </Text>
      </View>

      {/* Enter Workspace */}

      <Pressable
        onPress={() => router.push("/select-member")}
        style={{
          backgroundColor: "white",
          padding: 18,
          borderRadius: 16,
          marginTop: 25,
          marginBottom: 40,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "black",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          Enter Workspace
        </Text>
      </Pressable>
    </ScrollView>
  );
}
