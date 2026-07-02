import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import {
  getMemberByName,
  type MemberName,
  useSession,
} from "@/contexts/session-context";

const PASSCODES_STORAGE_KEY = "ccs-os:passcodes:v1";

type StoredPasscodes = Partial<Record<MemberName, string>>;

async function getStoredPasscodes() {
  const storedPasscodes = await AsyncStorage.getItem(PASSCODES_STORAGE_KEY);

  if (!storedPasscodes) {
    return {};
  }

  return JSON.parse(storedPasscodes) as StoredPasscodes;
}

export default function PasscodeScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [storedPasscode, setStoredPasscode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
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

  useEffect(() => {
    setPin("");
    setConfirmPin("");

    if (!activeMember) {
      setStoredPasscode(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    getStoredPasscodes()
      .then((passcodes) => {
        setStoredPasscode(passcodes[activeMember.name] ?? null);
        setIsLoaded(true);
      })
      .catch(() => {
        setStoredPasscode(null);
        setIsLoaded(true);
      });
  }, [activeMember]);

  const isCreateMode = isLoaded && storedPasscode === null;
  const canContinue = isCreateMode
    ? pin.length === 4 && confirmPin.length === 4
    : pin.length === 4;

  async function enterWorkspace() {
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
  }

  async function handleContinue() {
    if (!activeMember || !isLoaded || !canContinue) {
      return;
    }

    if (storedPasscode === null) {
      if (pin !== confirmPin) {
        Alert.alert("Passcodes Do Not Match", "Please confirm the same PIN.");
        return;
      }

      const passcodes = await getStoredPasscodes();
      await AsyncStorage.setItem(
        PASSCODES_STORAGE_KEY,
        JSON.stringify({
          ...passcodes,
          [activeMember.name]: pin,
        }),
      );
      setStoredPasscode(pin);
      await enterWorkspace();
      return;
    }

    if (pin !== storedPasscode) {
      setPin("");
      Alert.alert("Wrong Passcode", "Please try again.");
      return;
    }

    await enterWorkspace();
  }

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
        {isCreateMode ? "Create Passcode" : "Enter PIN"}
      </Text>

      <Text
        style={{
          color: "#888",
          marginTop: 8,
          marginBottom: 30,
        }}
      >
        {isCreateMode
          ? "Create a 4-digit workspace PIN"
          : "Enter your 4-digit workspace PIN"}
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

      {isCreateMode ? (
        <TextInput
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="Confirm PIN"
          placeholderTextColor="#555"
          style={{
            backgroundColor: "#111",
            color: "white",
            fontSize: 24,
            padding: 18,
            borderRadius: 16,
            textAlign: "center",
            marginTop: 12,
          }}
        />
      ) : null}

      <Pressable
        onPress={handleContinue}
        disabled={!isLoaded || !canContinue}
        style={{
          backgroundColor: isLoaded && canContinue ? "white" : "#333",
          padding: 18,
          borderRadius: 16,
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: isLoaded && canContinue ? "black" : "#777",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {isCreateMode ? "Save Passcode" : "Continue"}
        </Text>
      </Pressable>
    </View>
  );
}
