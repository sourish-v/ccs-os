import { Pressable, ScrollView, Text } from "react-native";

export default function MoreScreen() {
  const menuItems = [
    "Academics",
    "Journal",
    "Team",
    "Roadmap",
    "Profile",
    "Settings",
  ];

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
          marginBottom: 24,
        }}
      >
        Additional CCS OS modules
      </Text>

      {menuItems.map((item) => (
        <Pressable
          key={item}
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
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
