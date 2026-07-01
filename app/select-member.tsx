import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";

import { members, useSession } from "@/contexts/session-context";

export default function SelectMemberScreen() {
  const { setSelectedMember } = useSession();

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
          marginTop: 50,
        }}
      >
        CCS OS
      </Text>

      <Text
        style={{
          color: "#888",
          marginTop: 8,
          marginBottom: 30,
        }}
      >
        Select Member
      </Text>

      {members.map((member) => (
        <Pressable
          key={member.name}
          onPress={() => {
            setSelectedMember(member);
            router.push({
              pathname: "/passcode",
              params: {
                member: member.name,
              },
            });
          }}
          style={{
            backgroundColor: "#111",
            padding: 20,
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "600",
            }}
          >
            {member.name}
          </Text>

          <Text
            style={{
              color: "#AAA",
              marginTop: 8,
            }}
          >
            {member.role}
          </Text>

          <Text
            style={{
              color: "#777",
              marginTop: 4,
            }}
          >
            {member.skill}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
