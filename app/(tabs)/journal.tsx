import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface JournalEntry {
  id: string;
  date: string;
  week: number;
  phase: "vegetative" | "flowering";
  notes: string;
  checklist: {
    watered: boolean;
    fertilized: boolean;
    checked: boolean;
  };
}

export default function JournalScreen() {
  const colors = useColors();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    week: 1,
    phase: "vegetative" as JournalEntry["phase"],
    notes: "",
    checklist: {
      watered: false,
      fertilized: false,
      checked: false,
    },
  });

  const addEntry = () => {
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      week: newEntry.week,
      phase: newEntry.phase,
      notes: newEntry.notes.trim(),
      checklist: newEntry.checklist,
    };
    
    setEntries(prev => [entry, ...prev]);
    setNewEntry({
      week: newEntry.week + 1,
      phase: newEntry.phase,
      notes: "",
      checklist: { watered: false, fertilized: false, checked: false },
    });
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    });
  };

  const toggleChecklist = (key: keyof JournalEntry["checklist"]) => {
    setNewEntry(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: !prev.checklist[key],
      },
    }));
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-lg font-semibold text-foreground">Woche {item.week}</Text>
          <Text className="text-sm text-muted">{formatDate(item.date)}</Text>
        </View>
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: item.phase === "vegetative" ? "#4ADE8030" : "#22C55E30" }}
        >
          <Text 
            className="text-sm font-medium"
            style={{ color: item.phase === "vegetative" ? "#4ADE80" : "#22C55E" }}
          >
            {item.phase === "vegetative" ? "Vegetativ" : "Blüte"}
          </Text>
        </View>
      </View>
      
      {item.notes && (
        <Text className="text-base text-foreground mb-3">{item.notes}</Text>
      )}
      
      <View className="flex-row gap-3">
        {item.checklist.watered && (
          <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
            <IconSymbol name="checkmark.circle.fill" size={14} color={colors.primary} />
            <Text className="text-xs text-primary">Gegossen</Text>
          </View>
        )}
        {item.checklist.fertilized && (
          <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
            <IconSymbol name="checkmark.circle.fill" size={14} color={colors.primary} />
            <Text className="text-xs text-primary">Gedüngt</Text>
          </View>
        )}
        {item.checklist.checked && (
          <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
            <IconSymbol name="checkmark.circle.fill" size={14} color={colors.primary} />
            <Text className="text-xs text-primary">Kontrolliert</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-foreground">Grow Journal</Text>
          <Text className="text-base text-muted">{entries.length} Eintrag{entries.length !== 1 ? "e" : ""}</Text>
        </View>
        <TouchableOpacity 
          className="w-12 h-12 rounded-full bg-primary items-center justify-center"
          onPress={() => setShowModal(true)}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="book.fill" size={40} color={colors.primary} />
          </View>
          <Text className="text-lg font-medium text-foreground">Keine Einträge</Text>
          <Text className="text-base text-muted text-center">
            Beginne dein Grow-Tagebuch und dokumentiere deinen Fortschritt.
          </Text>
          <TouchableOpacity 
            className="bg-primary px-6 py-3 rounded-xl mt-2"
            onPress={() => setShowModal(true)}
          >
            <Text className="text-base font-semibold text-background">Eintrag hinzufügen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Entry Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-bold text-foreground">Neuer Eintrag</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">Woche</Text>
                <View className="flex-row items-center bg-surface rounded-xl border border-border">
                  <TouchableOpacity 
                    className="p-3"
                    onPress={() => setNewEntry(prev => ({ ...prev, week: Math.max(1, prev.week - 1) }))}
                  >
                    <Text className="text-xl text-primary font-bold">-</Text>
                  </TouchableOpacity>
                  <Text className="flex-1 text-center text-lg font-semibold text-foreground">
                    {newEntry.week}
                  </Text>
                  <TouchableOpacity 
                    className="p-3"
                    onPress={() => setNewEntry(prev => ({ ...prev, week: prev.week + 1 }))}
                  >
                    <Text className="text-xl text-primary font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">Phase</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl border ${
                      newEntry.phase === "vegetative" ? "bg-primary border-primary" : "border-border"
                    }`}
                    onPress={() => setNewEntry(prev => ({ ...prev, phase: "vegetative" }))}
                  >
                    <Text className={`text-center text-sm ${newEntry.phase === "vegetative" ? "text-background font-medium" : "text-foreground"}`}>
                      Veg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl border ${
                      newEntry.phase === "flowering" ? "bg-primary border-primary" : "border-border"
                    }`}
                    onPress={() => setNewEntry(prev => ({ ...prev, phase: "flowering" }))}
                  >
                    <Text className={`text-center text-sm ${newEntry.phase === "flowering" ? "text-background font-medium" : "text-foreground"}`}>
                      Blüte
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Checkliste</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                    newEntry.checklist.watered ? "bg-primary/20 border-primary" : "border-border"
                  }`}
                  onPress={() => toggleChecklist("watered")}
                >
                  {newEntry.checklist.watered && (
                    <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  )}
                  <Text className={newEntry.checklist.watered ? "text-primary font-medium" : "text-foreground"}>
                    Gegossen
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                    newEntry.checklist.fertilized ? "bg-primary/20 border-primary" : "border-border"
                  }`}
                  onPress={() => toggleChecklist("fertilized")}
                >
                  {newEntry.checklist.fertilized && (
                    <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  )}
                  <Text className={newEntry.checklist.fertilized ? "text-primary font-medium" : "text-foreground"}>
                    Gedüngt
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                    newEntry.checklist.checked ? "bg-primary/20 border-primary" : "border-border"
                  }`}
                  onPress={() => toggleChecklist("checked")}
                >
                  {newEntry.checklist.checked && (
                    <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  )}
                  <Text className={newEntry.checklist.checked ? "text-primary font-medium" : "text-foreground"}>
                    Kontrolliert
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Notizen</Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border min-h-[100px]"
                placeholder="Was ist diese Woche passiert?"
                placeholderTextColor={colors.muted}
                value={newEntry.notes}
                onChangeText={(text) => setNewEntry(prev => ({ ...prev, notes: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              className="rounded-xl p-4 items-center mt-2 bg-primary"
              onPress={addEntry}
            >
              <Text className="text-base font-semibold text-background">Eintrag speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
