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

import type { Task, TaskPriority } from "@/contexts/tasks-context";
import { useTasks } from "@/contexts/tasks-context";
import { useSession } from "@/contexts/session-context";

type FormModalMode = "create" | "edit";

function resetFormFields(
  setTitle: (value: string) => void,
  setDescription: (value: string) => void,
  setCategory: (value: string) => void,
  setPriority: (value: TaskPriority) => void,
  setDueDate: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
) {
  setTitle("");
  setDescription("");
  setCategory("");
  setPriority("medium");
  setDueDate("");
  setSharedWithTeam(false);
}

export default function TasksScreen() {
  const { selectedMember } = useSession();
  const {
    addTask,
    archiveTask,
    deleteTask,
    editTask,
    getTaskStats,
    getVisibleTasks,
    toggleTaskStatus,
  } = useTasks();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [sharedWithTeam, setSharedWithTeam] = useState(false);

  useEffect(() => {
    if (!selectedMember) {
      router.replace("/select-member");
    }
  }, [selectedMember]);

  const visibleTasks = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return getVisibleTasks(selectedMember.name);
  }, [getVisibleTasks, selectedMember]);

  const taskStats = useMemo(() => {
    if (!selectedMember) {
      return {
        pendingCount: 0,
        completedCount: 0,
        teamTasks: 0,
      };
    }

    return getTaskStats(selectedMember.name);
  }, [getTaskStats, selectedMember]);

  const canSaveTask =
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    (dueDate.trim().length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(dueDate));

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingTaskId(null);
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setPriority,
      setDueDate,
      setSharedWithTeam,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setPriority,
      setDueDate,
      setSharedWithTeam,
    );
    setEditingTaskId(null);
    setFormModalMode("create");
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? "");
    setSharedWithTeam(task.sharedWithTeam);
    setFormModalMode("edit");
  }

  function showTaskActionMenu(task: Task) {
    Alert.alert(task.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () => openEditModal(task),
      },
      {
        text: "Archive",
        onPress: () => confirmArchiveTask(task),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteTask(task),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function confirmArchiveTask(task: Task) {
    Alert.alert(
      "Archive Task",
      `Archive "${task.title}"? It will be hidden from your active tasks.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Archive",
          onPress: () => archiveTask(task.id),
        },
      ],
    );
  }

  function confirmDeleteTask(task: Task) {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTask(task.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveTask() {
    if (!selectedMember || !canSaveTask) {
      return;
    }

    const payload = {
      title,
      description,
      category,
      priority,
      dueDate: dueDate.trim() || undefined,
      sharedWithTeam,
    };

    if (formModalMode === "create") {
      await addTask({
        ...payload,
        createdBy: selectedMember.name,
      });
    } else if (formModalMode === "edit" && editingTaskId) {
      await editTask(editingTaskId, payload);
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
            Tasks
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Execute today{"'"}s work
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
          Task Stats
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
            <Text style={{ color: "#888", fontSize: 13 }}>Pending</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {taskStats.pendingCount}
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
              {taskStats.completedCount}
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
              {taskStats.teamTasks}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {visibleTasks.length === 0 ? (
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
              No tasks yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Create your first personal or team task.
            </Text>
          </View>
        ) : (
          visibleTasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => toggleTaskStatus(task.id)}
              onLongPress={() => showTaskActionMenu(task)}
              style={{
                backgroundColor: "#111",
                padding: 18,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: task.status === "completed" ? "#FFFFFF" : "#222",
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
                      {task.title}
                    </Text>

                    {task.sharedWithTeam ? (
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

                    {task.priority === "high" ? (
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

                  {task.description.trim().length > 0 ? (
                    <Text
                      style={{
                        color: "#777",
                        marginTop: 8,
                      }}
                    >
                      {task.description}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "#AAA",
                      marginTop: 8,
                    }}
                  >
                    {task.category}
                    {" \u2022 "}
                    {task.priority}
                    {task.dueDate ? ` \u2022 ${task.dueDate}` : ""}
                  </Text>
                </View>

                <Text
                  style={{
                    color: task.status === "completed" ? "white" : "#555",
                    fontSize: 28,
                    fontWeight: "700",
                  }}
                >
                  {task.status === "completed" ? "\u2713" : "\u25CB"}
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
                {formModalMode === "edit" ? "Edit Task" : "Add Task"}
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Task Title"
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

              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="Due Date (YYYY-MM-DD)"
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
                      {priority === option ? "\u25C9" : "\u25CB"} {option}
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
                  onPress={handleSaveTask}
                  disabled={!canSaveTask}
                  style={{
                    flex: 1,
                    backgroundColor: canSaveTask ? "white" : "#333",
                    padding: 16,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: canSaveTask ? "black" : "#777",
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
