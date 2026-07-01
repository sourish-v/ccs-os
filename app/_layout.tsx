import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GoalsProvider } from "@/contexts/goals-context";
import { HabitsProvider } from "@/contexts/habits-context";
import { ProjectsProvider } from "@/contexts/projects-context";
import { SessionProvider } from "@/contexts/session-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SessionProvider>
      <HabitsProvider>
        <GoalsProvider>
          <ProjectsProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack>
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="select-member"
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="passcode"
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: "modal",
                    title: "Modal",
                  }}
                />
              </Stack>

              <StatusBar style="auto" />
            </ThemeProvider>
          </ProjectsProvider>
        </GoalsProvider>
      </HabitsProvider>
    </SessionProvider>
  );
}
