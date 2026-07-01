import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { getMemberByName, useSession } from "@/contexts/session-context";

export default function PasscodeScreen() {
  const [pin, setPin] = useState("");
  const { member } = useLocalSearchParams<{ member?: string }>();
  const { selectedMember, setSelectedMember } = useSession();
  const routeMember = getMemberByName(member);
  const activeMember = selectedMember ?? routeMember;

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
    <View
      style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
        padding: 20,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#888",
          marginBottom: 10,
        }}
      >
        {activeMember?.name}
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "700",
        }}
      >
        Enter PIN
      </Text>

      <Text
        style={{
          color: "#888",
          marginTop: 8,
          marginBottom: 30,
        }}
      >
        Enter your 4-digit workspace PIN
      </Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        placeholder={"\u2022\u2022\u2022\u2022"}
        placeholderTextColor="#555"
        style={{
          backgroundColor: "#111",
          color: "white",
          fontSize: 24,
          padding: 18,
          borderRadius: 16,
          textAlign: "center",
        }}
      />

      <Pressable
        onPress={() => {
          if (!activeMember) {
            router.replace("/select-member");
            return;
          }

          router.replace({
            pathname: "/(tabs)",
            params: {
              member: activeMember.name,
            },
          });
        }}
        style={{
          backgroundColor: "white",
          padding: 18,
          borderRadius: 16,
          marginTop: 20,
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
          Continue
        </Text>
      </Pressable>
    </View>
  );
}
