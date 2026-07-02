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

import type { JournalEntry, JournalMood } from "@/contexts/journal-context";
import { useJournal } from "@/contexts/journal-context";
import { useSession } from "@/contexts/session-context";

const MOODS: JournalMood[] = ["Great", "Good", "Neutral", "Bad", "Terrible"];

type FormModalMode = "create" | "edit";

function resetFormFields(
  setTitle: (value: string) => void,
  setContent: (value: string) => void,
  setMood: (value: JournalMood) => void,
  setDate: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
) {
  setTitle("");
  setContent("");
  setMood("Neutral");
  setDate("");
  setSharedWithTeam(false);
}

export default function JournalScreen() {
  const { selectedMember } = useSession();
  const { addEntry, deleteEntry, editEntry, getVisibleEntries } = useJournal();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood>("Neutral");
  const [date, setDate] = useState("");
  const [sharedWithTeam, setSharedWithTeam] = useState(false);

  useEffect(() => {
    if (!selectedMember) {
      router.replace("/select-member");
    }
  }, [selectedMember]);

  const visibleEntries = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return getVisibleEntries(selectedMember.name);
  }, [getVisibleEntries, selectedMember]);

  const canSaveEntry =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingEntryId(null);
    resetFormFields(
      setTitle,
      setContent,
      setMood,
      setDate,
      setSharedWithTeam,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setContent,
      setMood,
      setDate,
      setSharedWithTeam,
    );
    setEditingEntryId(null);
    setFormModalMode("create");
  }

  function openEditModal(entry: JournalEntry) {
    setSelectedEntry(null);
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setDate(entry.date);
    setSharedWithTeam(entry.sharedWithTeam);
    setFormModalMode("edit");
  }

  function showEntryActionMenu(entry: JournalEntry) {
    Alert.alert(entry.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () => openEditModal(entry),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteEntry(entry),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function confirmDeleteEntry(entry: JournalEntry) {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete "${entry.title}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (selectedEntry?.id === entry.id) {
              setSelectedEntry(null);
            }

            deleteEntry(entry.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveEntry() {
    if (!selectedMember || !canSaveEntry) {
      return;
    }

    const payload = {
      title,
      content,
      mood,
      date,
      sharedWithTeam,
    };

    if (formModalMode === "create") {
      await addEntry({
        ...payload,
        createdBy: selectedMember.name,
      });
    } else if (formModalMode === "edit" && editingEntryId) {
      await editEntry(editingEntryId, payload);
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
            Journal
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Capture daily reflections
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

      <View style={{ marginTop: 24 }}>
        {visibleEntries.length === 0 ? (
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
              No journal entries yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Write your first personal or team reflection.
            </Text>
          </View>
        ) : (
          visibleEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => setSelectedEntry(entry)}
              onLongPress={() => showEntryActionMenu(entry)}
              style={{
                backgroundColor: "#111",
                padding: 18,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
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
                  {entry.title}
                </Text>

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
                  {entry.mood.toUpperCase()}
                </Text>

                {entry.sharedWithTeam ? (
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
                {entry.date}
              </Text>

              <Text
                numberOfLines={3}
                style={{
                  color: "#777",
                  marginTop: 8,
                  lineHeight: 20,
                }}
              >
                {entry.content}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedEntry !== null}
        onRequestClose={() => setSelectedEntry(null)}
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
              maxHeight: "82%",
            }}
          >
            {selectedEntry ? (
              <ScrollView>
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
                      fontSize: 26,
                      fontWeight: "700",
                    }}
                  >
                    {selectedEntry.title}
                  </Text>

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
                    {selectedEntry.mood.toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={{
                    color: "#AAA",
                    marginTop: 8,
                  }}
                >
                  {selectedEntry.date} {"\u2022"} Created by{" "}
                  {selectedEntry.createdBy}
                </Text>

                <Text
                  style={{
                    color: "white",
                    marginTop: 18,
                    lineHeight: 22,
                  }}
                >
                  {selectedEntry.content}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 22,
                    marginBottom: 20,
                  }}
                >
                  <Pressable
                    onPress={() => setSelectedEntry(null)}
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
                      Close
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openEditModal(selectedEntry)}
                    style={{
                      flex: 1,
                      backgroundColor: "white",
                      padding: 16,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "black",
                        fontWeight: "700",
                      }}
                    >
                      Edit
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

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
                {formModalMode === "edit" ? "Edit Entry" : "Add Entry"}
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Entry Title"
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
                value={content}
                onChangeText={setContent}
                placeholder="Content"
                placeholderTextColor="#555"
                multiline
                style={{
                  backgroundColor: "#111",
                  color: "white",
                  padding: 16,
                  borderRadius: 14,
                  marginTop: 12,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
              />

              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Date (YYYY-MM-DD)"
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
                  Mood
                </Text>

                {MOODS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setMood(option)}
                    style={{
                      marginBottom: option === "Terrible" ? 0 : 10,
                    }}
                  >
                    <Text
                      style={{
                        color: mood === option ? "white" : "#666",
                        fontSize: 15,
                      }}
                    >
                      {mood === option ? "\u25C9" : "\u25CB"} {option}
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
                  onPress={handleSaveEntry}
                  disabled={!canSaveEntry}
                  style={{
                    flex: 1,
                    backgroundColor: canSaveEntry ? "white" : "#333",
                    padding: 16,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: canSaveEntry ? "black" : "#777",
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
