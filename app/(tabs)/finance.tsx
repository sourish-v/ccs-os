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

import type { FinanceEntry, FinanceType } from "@/contexts/finance-context";
import { useFinance } from "@/contexts/finance-context";
import { useSession } from "@/contexts/session-context";

type FormModalMode = "create" | "edit";

function parseAmountInput(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatMoney(value: number) {
  return `₹${value.toFixed(0)}`;
}

function resetFormFields(
  setTitle: (value: string) => void,
  setAmount: (value: string) => void,
  setCategory: (value: string) => void,
  setType: (value: FinanceType) => void,
  setDate: (value: string) => void,
  setSharedWithTeam: (value: boolean) => void,
) {
  setTitle("");
  setAmount("");
  setCategory("");
  setType("expense");
  setDate("");
  setSharedWithTeam(false);
}

export default function FinanceScreen() {
  const { selectedMember } = useSession();
  const {
    addEntry,
    deleteEntry,
    editEntry,
    getFinanceStats,
    getVisibleEntries,
  } = useFinance();
  const [formModalMode, setFormModalMode] = useState<FormModalMode | null>(
    null,
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<FinanceType>("expense");
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

  const financeStats = useMemo(() => {
    if (!selectedMember) {
      return {
        income: 0,
        expenses: 0,
        currentBalance: 0,
      };
    }

    return getFinanceStats(selectedMember.name);
  }, [getFinanceStats, selectedMember]);

  const parsedAmount = parseAmountInput(amount);

  const canSaveEntry =
    title.trim().length > 0 &&
    parsedAmount !== null &&
    parsedAmount > 0 &&
    category.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  const isFormModalOpen = formModalMode !== null;

  function closeFormModal() {
    setFormModalMode(null);
    setEditingEntryId(null);
    resetFormFields(
      setTitle,
      setAmount,
      setCategory,
      setType,
      setDate,
      setSharedWithTeam,
    );
  }

  function openCreateModal() {
    resetFormFields(
      setTitle,
      setAmount,
      setCategory,
      setType,
      setDate,
      setSharedWithTeam,
    );
    setEditingEntryId(null);
    setFormModalMode("create");
  }

  function openEditModal(entry: FinanceEntry) {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setAmount(String(entry.amount));
    setCategory(entry.category);
    setType(entry.type);
    setDate(entry.date);
    setSharedWithTeam(entry.sharedWithTeam);
    setFormModalMode("edit");
  }

  function showEntryActionMenu(entry: FinanceEntry) {
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

  function confirmDeleteEntry(entry: FinanceEntry) {
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
            deleteEntry(entry.id).catch(() => {});
          },
        },
      ],
    );
  }

  async function handleSaveEntry() {
    if (!selectedMember || !canSaveEntry || parsedAmount === null) {
      return;
    }

    const payload = {
      title,
      amount: parsedAmount,
      category,
      type,
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
            Finance
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
            }}
          >
            Track local money flow
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
          Finance Stats
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
            <Text style={{ color: "#888", fontSize: 13 }}>Income</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {formatMoney(financeStats.income)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Expenses</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {formatMoney(financeStats.expenses)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Balance</Text>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {formatMoney(financeStats.currentBalance)}
            </Text>
          </View>
        </View>
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
              No transactions yet
            </Text>

            <Text
              style={{
                color: "#888",
                marginTop: 8,
              }}
            >
              Add your first income or expense entry.
            </Text>
          </View>
        ) : (
          visibleEntries.map((entry) => (
            <Pressable
              key={entry.id}
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
                      {entry.title}
                    </Text>

                    <Text
                      style={{
                        color: entry.type === "income" ? "black" : "white",
                        backgroundColor:
                          entry.type === "income" ? "white" : "#333",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {entry.type === "income" ? "INCOME" : "EXPENSE"}
                    </Text>

                    {entry.sharedWithTeam ? (
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
                    {entry.category}
                    {" \u2022 "}
                    {entry.date}
                  </Text>
                </View>

                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "700",
                  }}
                >
                  {entry.type === "expense" ? "-" : "+"}
                  {formatMoney(entry.amount)}
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
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
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
                  Type
                </Text>

                {(["income", "expense"] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
                    style={{
                      marginBottom: option === "expense" ? 0 : 10,
                    }}
                  >
                    <Text
                      style={{
                        color: type === option ? "white" : "#666",
                        fontSize: 15,
                        textTransform: "capitalize",
                      }}
                    >
                      {type === option ? "\u25C9" : "\u25CB"} {option}
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
