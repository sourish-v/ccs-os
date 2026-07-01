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

import type { Project, ProjectPriority } from "@/contexts/projects-context";
import { useProjects } from "@/contexts/projects-context";
import { useSession } from "@/contexts/session-context";

type FormModalMode = "create" | "edit";

function resetFormFields(
  setTitle: (value: string) => void,
  setDescription: (value: string) => void,
  setCategory: (value: string) => void,
  setPriority: (value: ProjectPriority) => void,
  setDeadline: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
) {
  setTitle("");
  setDescription("");
  setCategory("");
  setPriority("medium");
  setDeadline("");
  setSharedWithTeam(false);
}

export default function ProjectsScreen() {
  const { selectedMember } = useSession();
  const {
    addProject,
    archiveProject,
    deleteProject,
    editProject,
    getProjectStats,
    getVisibleProjects,
    toggleProjectStatus,
  } = useProjects();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [sharedWithTeam, setSharedWithTeam] = useState(false);

  useEffect(() => {
    if (!selectedMember) {
      router.replace("/select-member");
    }
  }, [selectedMember]);

  const visibleProjects = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return getVisibleProjects(selectedMember.name);
  }, [getVisibleProjects, selectedMember]);

  const projectStats = useMemo(() => {
    if (!selectedMember) {
      return {
        activeCount: 0,
        completedCount: 0,
        teamProjects: 0,
      };
    }

    return getProjectStats(selectedMember.name);
  }, [getProjectStats, selectedMember]);

  const canSaveProject =
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    (deadline.trim().length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(deadline));

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingProjectId(null);
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setPriority,
      setDeadline,
      setSharedWithTeam,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setDescription,
      setCategory,
      setPriority,
      setDeadline,
      setSharedWithTeam,
    );
    setEditingProjectId(null);
    setFormModalMode("create");
  }

  function openEditModal(project: Project) {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setPriority(project.priority);
    setDeadline(project.deadline ?? "");
    setSharedWithTeam(project.sharedWithTeam);
    setFormModalMode("edit");
  }

  function showProjectActionMenu(project: Project) {
    Alert.alert(project.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () => openEditModal(project),
      },
      {
        text: "Archive",
        onPress: () => confirmArchiveProject(project),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteProject(project),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function confirmArchiveProject(project: Project) {
    Alert.alert(
      "Archive Project",
      `Archive "${project.title}"? It will be hidden from your active projects.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Archive",
          onPress: () => archiveProject(project.id),
        },
      ],
    );
  }

  function confirmDeleteProject(project: Project) {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProject(project.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveProject() {
    if (!selectedMember || !canSaveProject) {
      return;
    }

    const payload = {
      title,
      description,
      category,
      priority,
      deadline: deadline.trim() || undefined,
      sharedWithTeam,
    };

    if (formModalMode === "create") {
      await addProject({
        ...payload,
        createdBy: selectedMember.name,
      });
    } else if (formModalMode === "edit" && editingProjectId) {
      await editProject(editingProjectId, payload);
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
            Projects
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Ship focused work
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
          Project Stats
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
              {projectStats.activeCount}
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
              {projectStats.completedCount}
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
              {projectStats.teamProjects}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {visibleProjects.length === 0 ? (
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
              No projects yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Create your first personal or team project.
            </Text>
          </View>
        ) : (
          visibleProjects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => toggleProjectStatus(project.id)}
              onLongPress={() => showProjectActionMenu(project)}
              style={{
                backgroundColor: "#111",
                padding: 18,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor:
                  project.status === "completed" ? "#FFFFFF" : "#222",
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
                      {project.title}
                    </Text>

                    {project.sharedWithTeam ? (
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

                    {project.priority === "high" ? (
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

                  {project.description.trim().length > 0 ? (
                    <Text
                      style={{
                        color: "#777",
                        marginTop: 8,
                      }}
                    >
                      {project.description}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "#AAA",
                      marginTop: 8,
                    }}
                  >
                    {project.category}
                    {" \u2022 "}
                    {project.priority}
                    {project.deadline ? ` \u2022 ${project.deadline}` : ""}
                  </Text>

                  <Text
                    style={{
                      color: "#777",
                      marginTop: 6,
                      textTransform: "capitalize",
                    }}
                  >
                    {project.status} {"\u2022"} Created by {project.createdBy}
                  </Text>
                </View>

                <Text
                  style={{
                    color: project.status === "completed" ? "white" : "#555",
                    fontSize: 28,
                    fontWeight: "700",
                  }}
                >
                  {project.status === "completed" ? "\u2713" : "\u25CB"}
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
                {formModalMode === "edit" ? "Edit Project" : "Add Project"}
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Project Title"
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
                value={deadline}
                onChangeText={setDeadline}
                placeholder="Deadline (YYYY-MM-DD)"
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
                  onPress={handleSaveProject}
                  disabled={!canSaveProject}
                  style={{
                    flex: 1,
                    backgroundColor: canSaveProject ? "white" : "#333",
                    padding: 16,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: canSaveProject ? "black" : "#777",
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
