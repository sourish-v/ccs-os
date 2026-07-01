import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Habit, HabitFrequency } from "@/contexts/habits-context";
import { useHabits } from "@/contexts/habits-context";
import { useSession } from "@/contexts/session-context";

const DEFAULT_REMINDER_TIME = "07:00";

type FormModalMode = "create" | "edit";

function resetFormFields(
  setTitle: (value: string) => void,
  setCategory: (value: string) => void,
  setReminderTime: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
  setFrequency: (value: HabitFrequency) => void,
) {
  setTitle("");
  setCategory("");
  setReminderTime(DEFAULT_REMINDER_TIME);
  setSharedWithTeam(false);
  setFrequency("daily");
}

export default function HabitsScreen() {
  const { selectedMember } = useSession();
  const { addHabit, deleteHabit, editHabit, getVisibleHabits, toggleHabit } =
    useHabits();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [sharedWithTeam, setSharedWithTeam] = useState(false);
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");

  useEffect(() => {
    if (!selectedMember) {
      router.replace("/select-member");
    }
  }, [selectedMember]);

  const visibleHabits = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return getVisibleHabits(selectedMember.name);
  }, [getVisibleHabits, selectedMember]);

  const habitStats = useMemo(() => {
    const completedToday = visibleHabits.filter((habit) => habit.completed).length;
    const bestCurrentStreak = visibleHabits.reduce((best, habit) => {
      if (habit.frequency !== "daily") {
        return best;
      }

      return Math.max(best, habit.streak);
    }, 0);
    const teamHabitsCount = visibleHabits.filter(
      (habit) => habit.sharedWithTeam,
    ).length;

    return {
      completedToday,
      totalVisible: visibleHabits.length,
      bestCurrentStreak,
      teamHabitsCount,
    };
  }, [visibleHabits]);

  const canSaveHabit =
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    /^\d{2}:\d{2}$/.test(reminderTime);

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingHabitId(null);
    resetFormFields(
      setTitle,
      setCategory,
      setReminderTime,
      setSharedWithTeam,
      setFrequency,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setCategory,
      setReminderTime,
      setSharedWithTeam,
      setFrequency,
    );
    setEditingHabitId(null);
    setFormModalMode("create");
  }

  function openEditModal(habit: Habit) {
    setEditingHabitId(habit.id);
    setTitle(habit.title);
    setCategory(habit.category);
    setReminderTime(habit.reminderTime);
    setSharedWithTeam(habit.sharedWithTeam);
    setFrequency(habit.frequency);
    setFormModalMode("edit");
  }

  function showHabitActionMenu(habit: Habit) {
    Alert.alert(habit.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () => openEditModal(habit),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteHabit(habit),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function confirmDeleteHabit(habit: Habit) {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.title}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteHabit(habit.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveHabit() {
    if (!selectedMember || !canSaveHabit) {
      return;
    }

    if (formModalMode === "create") {
      await addHabit({
        title,
        category,
        reminderTime,
        sharedWithTeam,
        createdBy: selectedMember.name,
        frequency,
      });
    } else if (formModalMode === "edit" && editingHabitId) {
      await editHabit(editingHabitId, {
        title,
        category,
        reminderTime,
        sharedWithTeam,
        frequency,
      });
    }

    closeFormModal();
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <View>
          <Text
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: "700",
            }}
          >
            Habits
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Build daily consistency
          </Text>
        </View>

        <Pressable
          onPress={openCreateModal}
          style={{
            backgroundColor: "white",
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: "black",
              fontWeight: "700",
            }}
          >
            Add
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: "#111",
          padding: 20,
          borderRadius: 16,
          marginTop: 24,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Habit Stats
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Today</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {habitStats.completedToday} / {habitStats.totalVisible}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Best Streak</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {habitStats.bestCurrentStreak}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Team</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {habitStats.teamHabitsCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {visibleHabits.length === 0 ? (
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
                fontSize: 20,
                fontWeight: "600",
              }}
            >
              No habits yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Create your first personal or team habit.
            </Text>
          </View>
        ) : (
          visibleHabits.map((habit) => (
            <Pressable
              key={habit.id}
              onPress={() => toggleHabit(habit.id)}
              onLongPress={() => showHabitActionMenu(habit)}
              style={{
                backgroundColor: "#111",
                padding: 18,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: habit.completed ? "#FFFFFF" : "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "600",
                      }}
                    >
                      {habit.title}
                    </Text>

                    {habit.sharedWithTeam ? (
                      <Text
                        style={{
                          color: "black",
                          backgroundColor: "white",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        TEAM
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={{
                      color: "#AAA",
                      marginTop: 8,
                    }}
                  >
                    {habit.category} {"\u2022"} {habit.reminderTime}
                  </Text>

                  <Text
                    style={{
                      color: "#777",
                      marginTop: 6,
                    }}
                  >
                    {habit.frequency === "today"
                      ? "📅 Today Only"
                      : `🔥 ${habit.streak} day streak`}
                  </Text>
                </View>

                <Text
                  style={{
                    color: habit.completed ? "white" : "#555",
                    fontSize: 28,
                    fontWeight: "700",
                  }}
                >
                  {habit.completed ? "\u2713" : "\u25CB"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isFormModalOpen}
        onRequestClose={closeFormModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#0A0A0A",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: "700",
              }}
            >
              {formModalMode === "edit" ? "Edit Habit" : "Add Habit"}
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Habit Name"
              placeholderTextColor="#555"
              style={{
                backgroundColor: "#111",
                color: "white",
                padding: 16,
                borderRadius: 14,
                marginTop: 18,
              }}
            />

            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
              placeholderTextColor="#555"
              style={{
                backgroundColor: "#111",
                color: "white",
                padding: 16,
                borderRadius: 14,
                marginTop: 12,
              }}
            />

            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="Reminder Time"
              placeholderTextColor="#555"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={{
                backgroundColor: "#111",
                color: "white",
                padding: 16,
                borderRadius: 14,
                marginTop: 12,
              }}
            />

            <View
              style={{
                backgroundColor: "#111",
                padding: 16,
                borderRadius: 14,
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Share With Team
              </Text>

              <Switch
                value={sharedWithTeam}
                onValueChange={setSharedWithTeam}
              />
            </View>

            <View
              style={{
                backgroundColor: "#111",
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
                  marginBottom: 12,
                }}
              >
                Frequency
              </Text>

              <Pressable
                onPress={() => setFrequency("daily")}
                style={{
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: frequency === "daily" ? "white" : "#666",
                    fontSize: 15,
                  }}
                >
                  {frequency === "daily" ? "◉" : "○"} Daily
                </Text>
              </Pressable>

              <Pressable onPress={() => setFrequency("today")}>
                <Text
                  style={{
                    color: frequency === "today" ? "white" : "#666",
                    fontSize: 15,
                  }}
                >
                  {frequency === "today" ? "◉" : "○"} Today Only
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 18,
              }}
            >
              <Pressable
                onPress={closeFormModal}
                style={{
                  flex: 1,
                  backgroundColor: "#111",
                  padding: 16,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveHabit}
                disabled={!canSaveHabit}
                style={{
                  flex: 1,
                  backgroundColor: canSaveHabit ? "white" : "#333",
                  padding: 16,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: canSaveHabit ? "black" : "#777",
                    fontWeight: "700",
                  }}
                >
                  {formModalMode === "edit" ? "Save" : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
