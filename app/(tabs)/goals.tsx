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

import { GOAL_CATEGORY_SUGGESTIONS } from "@/constants/goals";
import type { Goal, GoalPriority } from "@/contexts/goals-context";
import { useGoals } from "@/contexts/goals-context";
import { useSession } from "@/contexts/session-context";

type FormModalMode = "create" | "edit";

function parseNumericInput(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function resetFormFields(
  setTitle: (value: string) => void,
  setDescription: (value: string) => void,
  setCategory: (value: string) => void,
  setUnit: (value: string) => void,
  setCurrentValue: (value: string) => void,
  setTargetValue: (value: string) => void,
  setPriority: (value: GoalPriority) => void,
  setTargetDate: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
) {
  setTitle("");
  setDescription("");
  setCategory("");
  setUnit("");
  setCurrentValue("0");
  setTargetValue("1");
  setPriority("medium");
  setTargetDate("");
  setSharedWithTeam(false);
}

export default function GoalsScreen() {
  const { selectedMember } = useSession();
  const {
    addGoal,
    archiveGoal,
    deleteGoal,
    editGoal,
    getGoalProgressLabel,
    getGoalProgressPercent,
    getGoalStats,
    getVisibleGoals,
    toggleGoalStatus,
  } = useGoals();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [targetValue, setTargetValue] = useState("1");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [targetDate, setTargetDate] = useState("");
  const [sharedWithTeam, setSharedWithTeam] = useState(false);

  useEffect(() => {
    if (!selectedMember) {
      router.replace("/select-member");
    }
  }, [selectedMember]);

  const visibleGoals = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return getVisibleGoals(selectedMember.name);
  }, [getVisibleGoals, selectedMember]);

  const goalStats = useMemo(() => {
    if (!selectedMember) {
      return {
        activeCount: 0,
        completedCount: 0,
        priorityCount: 0,
        averageProgress: 0,
      };
    }

    return getGoalStats(selectedMember.name);
  }, [getGoalStats, selectedMember]);

  const parsedCurrentValue = parseNumericInput(currentValue);
  const parsedTargetValue = parseNumericInput(targetValue);

  const canSaveGoal =
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    unit.trim().length > 0 &&
    parsedCurrentValue !== null &&
    parsedCurrentValue >= 0 &&
    parsedTargetValue !== null &&
    parsedTargetValue > 0 &&
    (targetDate.trim().length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(targetDate));

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingGoalId(null);
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setUnit,
      setCurrentValue,
      setTargetValue,
      setPriority,
      setTargetDate,
      setSharedWithTeam,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setUnit,
      setCurrentValue,
      setTargetValue,
      setPriority,
      setTargetDate,
      setSharedWithTeam,
    );
    setEditingGoalId(null);
    setFormModalMode("create");
  }

  function openEditModal(goal: Goal) {
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description);
    setCategory(goal.category);
    setUnit(goal.unit);
    setCurrentValue(String(goal.currentValue));
    setTargetValue(String(goal.targetValue));
    setPriority(goal.priority);
    setTargetDate(goal.targetDate ?? "");
    setSharedWithTeam(goal.sharedWithTeam);
    setFormModalMode("edit");
  }

  function showGoalActionMenu(goal: Goal) {
    Alert.alert(goal.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () => openEditModal(goal),
      },
      {
        text: "Archive",
        onPress: () => confirmArchiveGoal(goal),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteGoal(goal),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function confirmArchiveGoal(goal: Goal) {
    Alert.alert(
      "Archive Goal",
      `Archive "${goal.title}"? It will be hidden from your active goals.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Archive",
          onPress: () => archiveGoal(goal.id),
        },
      ],
    );
  }

  function confirmDeleteGoal(goal: Goal) {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.title}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteGoal(goal.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveGoal() {
    if (
      !selectedMember ||
      !canSaveGoal ||
      parsedCurrentValue === null ||
      parsedTargetValue === null
    ) {
      return;
    }

    const payload = {
      title,
      description,
      category,
      unit,
      currentValue: parsedCurrentValue,
      targetValue: parsedTargetValue,
      priority,
      targetDate: targetDate.trim() || undefined,
      sharedWithTeam,
    };

    if (formModalMode === "create") {
      await addGoal({
        ...payload,
        createdBy: selectedMember.name,
      });
    } else if (formModalMode === "edit" && editingGoalId) {
      await editGoal(editingGoalId, payload);
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
            Goals
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Track measurable outcomes
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
          Goal Stats
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
            <Text style={{ color: "#888", fontSize: 13 }}>Active</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {goalStats.activeCount}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Completed</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {goalStats.completedCount}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Avg Progress</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {goalStats.averageProgress}%
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {visibleGoals.length === 0 ? (
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
              No goals yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Create your first personal or team goal.
            </Text>
          </View>
        ) : (
          visibleGoals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => toggleGoalStatus(goal.id)}
              onLongPress={() => showGoalActionMenu(goal)}
              style={{
                backgroundColor: "#111",
                padding: 18,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: goal.status === "completed" ? "#FFFFFF" : "#222",
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
                      {goal.title}
                    </Text>

                    {goal.sharedWithTeam ? (
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

                    {goal.priority === "high" ? (
                      <Text
                        style={{
                          color: "white",
                          backgroundColor: "#333",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        HIGH
                      </Text>
                    ) : null}
                  </View>

                  {goal.description.trim().length > 0 ? (
                    <Text
                      style={{
                        color: "#777",
                        marginTop: 8,
                      }}
                    >
                      {goal.description}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "#AAA",
                      marginTop: 8,
                    }}
                  >
                    {goal.category}
                    {" \u2022 "}
                    {goal.priority}
                    {goal.targetDate ? ` \u2022 ${goal.targetDate}` : ""}
                  </Text>

                  <Text
                    style={{
                      color: "#AAA",
                      marginTop: 6,
                    }}
                  >
                    {getGoalProgressLabel(goal)}
                  </Text>

                  <Text
                    style={{
                      color: "#777",
                      marginTop: 6,
                    }}
                  >
                    {getGoalProgressPercent(goal)}% complete
                  </Text>
                </View>

                <Text
                  style={{
                    color: goal.status === "completed" ? "white" : "#555",
                    fontSize: 28,
                    fontWeight: "700",
                  }}
                >
                  {goal.status === "completed" ? "\u2713" : "\u25CB"}
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
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
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
                {formModalMode === "edit" ? "Edit Goal" : "Add Goal"}
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Goal Title"
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
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                placeholderTextColor="#555"
                multiline
                style={{
                  backgroundColor: "#111",
                  color: "white",
                  padding: 16,
                  borderRadius: 14,
                  marginTop: 12,
                  minHeight: 88,
                  textAlignVertical: "top",
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

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {GOAL_CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => setCategory(suggestion)}
                    style={{
                      backgroundColor:
                        category === suggestion ? "white" : "#222",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        color: category === suggestion ? "black" : "#AAA",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="Unit (kg, followers, INR)"
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
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder="Current Value"
                placeholderTextColor="#555"
                keyboardType="numeric"
                style={{
                  backgroundColor: "#111",
                  color: "white",
                  padding: 16,
                  borderRadius: 14,
                  marginTop: 12,
                }}
              />

              <TextInput
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="Target Value"
                placeholderTextColor="#555"
                keyboardType="numeric"
                style={{
                  backgroundColor: "#111",
                  color: "white",
                  padding: 16,
                  borderRadius: 14,
                  marginTop: 12,
                }}
              />

              <TextInput
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="Target Date (YYYY-MM-DD)"
                placeholderTextColor="#555"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
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
                  Priority
                </Text>

                {(["high", "medium", "low"] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setPriority(option)}
                    style={{
                      marginBottom: option === "low" ? 0 : 10,
                    }}
                  >
                    <Text
                      style={{
                        color: priority === option ? "white" : "#666",
                        fontSize: 15,
                        textTransform: "capitalize",
                      }}
                    >
                      {priority === option ? "◉" : "○"} {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

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
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 18,
                  marginBottom: 20,
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
                  onPress={handleSaveGoal}
                  disabled={!canSaveGoal}
                  style={{
                    flex: 1,
                    backgroundColor: canSaveGoal ? "white" : "#333",
                    padding: 16,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: canSaveGoal ? "black" : "#777",
                      fontWeight: "700",
                    }}
                  >
                    {formModalMode === "edit" ? "Save" : "Create"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
