import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { useGamification } from "@/lib/gamification-context";

type GrowPhase = "germination" | "seedling" | "vegetative" | "flowering" | "harvest";
type ViewMode = "guide" | "entries" | "timeline";

interface GrowStep {
  id: string;
  phase: GrowPhase;
  title: string;
  description: string;
  tips: string[];
  duration: string;
  completed: boolean;
  completedAt?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  week: number;
  phase: GrowPhase;
  notes: string;
  checklist: {
    watered: boolean;
    fertilized: boolean;
    checked: boolean;
  };
}

const GROW_GUIDE: GrowStep[] = [
  // Germination
  { id: "g1", phase: "germination", title: "Samen einweichen", description: "12-24h in lauwarmem Wasser", tips: ["20-25°C Wasser", "Dunkler Ort"], duration: "12-24h", completed: false },
  { id: "g2", phase: "germination", title: "Papiertuch-Methode", description: "Zwischen feuchte Tücher legen", tips: ["Feucht halten", "Täglich prüfen"], duration: "2-5 Tage", completed: false },
  { id: "g3", phase: "germination", title: "Einpflanzen", description: "Bei 1-2cm Wurzel einsetzen", tips: ["Wurzel nach unten", "0.5cm tief"], duration: "1 Tag", completed: false },
  // Seedling
  { id: "s1", phase: "seedling", title: "Keimblätter erscheinen", description: "Erste runde Blätter brechen durch", tips: ["Licht 18/6", "Keine Nährstoffe"], duration: "3-7 Tage", completed: false },
  { id: "s2", phase: "seedling", title: "Erstes Blattpaar", description: "Gezackte Blätter entwickeln sich", tips: ["65-70% Luftfeuchte", "22-25°C"], duration: "5-7 Tage", completed: false },
  { id: "s3", phase: "seedling", title: "3-4 Blattpaare", description: "Bereit für erste Düngung", tips: ["1/4 Dosis Dünger", "Umtopfen planen"], duration: "7-14 Tage", completed: false },
  // Vegetative
  { id: "v1", phase: "vegetative", title: "Umtopfen", description: "In finalen Topf (11-20L)", tips: ["Wurzeln schonen", "1-2 Tage ruhen"], duration: "1 Tag", completed: false },
  { id: "v2", phase: "vegetative", title: "Training (LST/HST)", description: "Für buschiges Wachstum", tips: ["LST: Äste biegen", "Topping möglich"], duration: "Fortlaufend", completed: false },
  { id: "v3", phase: "vegetative", title: "Düngung etablieren", description: "Wöchentlicher Düngeplan", tips: ["N-P-K beachten", "EC messen"], duration: "Wöchentlich", completed: false },
  { id: "v4", phase: "vegetative", title: "Gewünschte Größe", description: "Bereit für Blüte (verdoppelt sich!)", tips: ["Min. 30cm", "Starker Stamm"], duration: "3-8 Wochen", completed: false },
  // Flowering
  { id: "f1", phase: "flowering", title: "12/12 Lichtzyklus", description: "Blüte einleiten", tips: ["Absolute Dunkelheit", "Timer nutzen"], duration: "1 Tag", completed: false },
  { id: "f2", phase: "flowering", title: "Geschlecht bestimmen", description: "Nach 1-2 Wochen sichtbar", tips: ["♀: weiße Härchen", "♂: Pollensäcke entfernen"], duration: "1-2 Wochen", completed: false },
  { id: "f3", phase: "flowering", title: "Blütedünger", description: "Mehr P und K", tips: ["Weniger N", "EC erhöhen"], duration: "Ab Woche 2", completed: false },
  { id: "f4", phase: "flowering", title: "Blütenentwicklung", description: "Knospen werden dichter", tips: ["40-50% Luftfeuchte", "Auf Schimmel achten"], duration: "Woche 3-6", completed: false },
  { id: "f5", phase: "flowering", title: "Spülen", description: "2 Wochen nur Wasser", tips: ["Besserer Geschmack", "Blätter werden gelb"], duration: "2 Wochen", completed: false },
  // Harvest
  { id: "h1", phase: "harvest", title: "Trichome prüfen", description: "Mit Lupe kontrollieren", tips: ["Milchig = THC Peak", "Bernstein = mehr CBD"], duration: "Täglich", completed: false },
  { id: "h2", phase: "harvest", title: "Ernte", description: "Pflanze abschneiden", tips: ["Morgens ernten", "Handschuhe tragen"], duration: "1 Tag", completed: false },
  { id: "h3", phase: "harvest", title: "Trocknen", description: "Kopfüber aufhängen", tips: ["18-22°C", "50-60% Luftfeuchte"], duration: "7-14 Tage", completed: false },
  { id: "h4", phase: "harvest", title: "Trimmen", description: "Blätter entfernen", tips: ["Reste aufbewahren", "Geduld haben"], duration: "Mehrere Stunden", completed: false },
  { id: "h5", phase: "harvest", title: "Curing", description: "In Gläser, täglich lüften", tips: ["75% füllen", "2-4 Wochen min."], duration: "2-8 Wochen", completed: false },
];

const PHASE_INFO: Record<GrowPhase, { name: string; icon: string; color: string }> = {
  germination: { name: "Keimung", icon: "🌱", color: "#8B4513" },
  seedling: { name: "Sämling", icon: "🌿", color: "#90EE90" },
  vegetative: { name: "Vegetativ", icon: "🪴", color: "#228B22" },
  flowering: { name: "Blüte", icon: "🌸", color: "#FF69B4" },
  harvest: { name: "Ernte", icon: "✂️", color: "#FFD700" },
};

const STORAGE_KEY = "growmaster_journal_v2";

export default function JournalScreen() {
  const colors = useColors();
  const { tier } = useSubscription();
  const { incrementStat, checkForNewAchievements } = useGamification();
  
  const [viewMode, setViewMode] = useState<ViewMode>("guide");
  const [currentPhase, setCurrentPhase] = useState<GrowPhase>("germination");
  const [steps, setSteps] = useState<GrowStep[]>(GROW_GUIDE);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    week: 1,
    phase: "vegetative" as GrowPhase,
    notes: "",
    checklist: { watered: false, fertilized: false, checked: false },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.steps) setSteps(data.steps);
        if (data.entries) setEntries(data.entries);
        if (data.currentPhase) setCurrentPhase(data.currentPhase);
      }
    } catch (e) {
      console.error("Load error:", e);
    }
  };

  const saveData = async (newSteps: GrowStep[], newEntries: JournalEntry[], phase: GrowPhase) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ steps: newSteps, entries: newEntries, currentPhase: phase }));
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const toggleStep = (stepId: string) => {
    const newSteps = steps.map(step => {
      if (step.id === stepId) {
        const completed = !step.completed;
        if (completed) {
          incrementStat("journalEntries", 1);
          const phaseSteps = steps.filter(s => s.phase === step.phase);
          const completedCount = phaseSteps.filter(s => s.completed || s.id === stepId).length;
          if (completedCount === phaseSteps.length) {
            if (step.phase === "harvest") incrementStat("totalHarvests", 1);
          }
          checkForNewAchievements();
        }
        return { ...step, completed, completedAt: completed ? new Date().toISOString() : undefined };
      }
      return step;
    });
    setSteps(newSteps);
    saveData(newSteps, entries, currentPhase);
  };

  const addEntry = () => {
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      week: newEntry.week,
      phase: newEntry.phase,
      notes: newEntry.notes.trim(),
      checklist: newEntry.checklist,
    };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    setNewEntry({ week: newEntry.week + 1, phase: newEntry.phase, notes: "", checklist: { watered: false, fertilized: false, checked: false } });
    setShowModal(false);
    incrementStat("journalEntries", 1);
    saveData(steps, newEntries, currentPhase);
  };

  const getPhaseProgress = (phase: GrowPhase) => {
    const phaseSteps = steps.filter(s => s.phase === phase);
    const completed = phaseSteps.filter(s => s.completed).length;
    return { completed, total: phaseSteps.length, percent: phaseSteps.length > 0 ? (completed / phaseSteps.length) * 100 : 0 };
  };

  const totalProgress = {
    completed: steps.filter(s => s.completed).length,
    total: steps.length,
    percent: (steps.filter(s => s.completed).length / steps.length) * 100,
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const toggleChecklist = (key: keyof JournalEntry["checklist"]) => {
    setNewEntry(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  return (
    <ScreenContainer className="px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">Grow Journal</Text>
          <Text className="text-sm text-muted">{totalProgress.percent.toFixed(0)}% abgeschlossen</Text>
        </View>
        <TouchableOpacity className="w-12 h-12 rounded-full bg-primary items-center justify-center" onPress={() => setShowModal(true)}>
          <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="bg-surface rounded-xl p-4 border border-border mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-foreground">Gesamtfortschritt</Text>
          <Text className="text-sm font-bold text-primary">{totalProgress.completed}/{totalProgress.total}</Text>
        </View>
        <View className="h-2 bg-background rounded-full overflow-hidden">
          <View className="h-full bg-primary rounded-full" style={{ width: `${totalProgress.percent}%` }} />
        </View>
      </View>

      {/* Phase Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {(Object.keys(PHASE_INFO) as GrowPhase[]).map(phase => {
            const progress = getPhaseProgress(phase);
            return (
              <TouchableOpacity
                key={phase}
                className={`px-4 py-2 rounded-xl ${currentPhase === phase ? 'bg-primary' : 'bg-surface border border-border'}`}
                onPress={() => setCurrentPhase(phase)}
              >
                <View className="flex-row items-center gap-2">
                  <Text>{PHASE_INFO[phase].icon}</Text>
                  <View>
                    <Text className={`text-sm font-medium ${currentPhase === phase ? 'text-white' : 'text-foreground'}`}>{PHASE_INFO[phase].name}</Text>
                    <Text className={`text-xs ${currentPhase === phase ? 'text-white/70' : 'text-muted'}`}>{progress.completed}/{progress.total}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* View Mode Tabs */}
      <View className="flex-row gap-2 mb-4">
        {[
          { id: "guide" as ViewMode, label: "Guide", icon: "list.bullet" },
          { id: "entries" as ViewMode, label: "Einträge", icon: "doc.text.fill" },
          { id: "timeline" as ViewMode, label: "Timeline", icon: "clock.fill" },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg ${viewMode === tab.id ? 'bg-primary' : 'bg-surface'}`}
            onPress={() => setViewMode(tab.id)}
          >
            <IconSymbol name={tab.icon as any} size={14} color={viewMode === tab.id ? "#fff" : colors.muted} />
            <Text className={`text-sm font-medium ${viewMode === tab.id ? 'text-white' : 'text-muted'}`}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Guide View */}
        {viewMode === "guide" && (
          <View className="gap-3">
            {steps.filter(s => s.phase === currentPhase).map((step, index) => (
              <TouchableOpacity
                key={step.id}
                className={`bg-surface rounded-xl p-4 border ${step.completed ? 'border-success bg-success/10' : 'border-border'}`}
                onPress={() => toggleStep(step.id)}
              >
                <View className="flex-row items-start gap-3">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${step.completed ? 'bg-success' : 'bg-border'}`}>
                    {step.completed ? <IconSymbol name="checkmark" size={18} color="#fff" /> : <Text className="text-sm font-bold text-muted">{index + 1}</Text>}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-base font-semibold ${step.completed ? 'text-success line-through' : 'text-foreground'}`}>{step.title}</Text>
                      <Text className="text-xs text-muted">{step.duration}</Text>
                    </View>
                    <Text className="text-sm text-muted mt-1">{step.description}</Text>
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {step.tips.map((tip, i) => (
                        <View key={i} className="flex-row items-center gap-1 bg-warning/20 px-2 py-1 rounded">
                          <IconSymbol name="lightbulb.fill" size={10} color={colors.warning} />
                          <Text className="text-xs text-foreground">{tip}</Text>
                        </View>
                      ))}
                    </View>
                    {step.completedAt && <Text className="text-xs text-success mt-2">✓ {formatDate(step.completedAt)}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Entries View */}
        {viewMode === "entries" && (
          <View className="gap-3">
            {entries.length === 0 ? (
              <View className="bg-surface rounded-xl p-8 border border-border items-center">
                <Text className="text-4xl mb-3">📝</Text>
                <Text className="text-base font-semibold text-foreground mb-1">Keine Einträge</Text>
                <Text className="text-sm text-muted text-center">Dokumentiere deinen Grow mit Einträgen.</Text>
              </View>
            ) : (
              entries.map(entry => (
                <View key={entry.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-lg font-semibold text-foreground">Woche {entry.week}</Text>
                      <Text className="text-sm text-muted">{formatDate(entry.date)}</Text>
                    </View>
                    <View className="px-2 py-1 rounded-full" style={{ backgroundColor: PHASE_INFO[entry.phase].color + "30" }}>
                      <Text className="text-xs font-medium" style={{ color: PHASE_INFO[entry.phase].color }}>{PHASE_INFO[entry.phase].name}</Text>
                    </View>
                  </View>
                  {entry.notes && <Text className="text-sm text-foreground mb-2">{entry.notes}</Text>}
                  <View className="flex-row gap-2">
                    {entry.checklist.watered && <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full"><IconSymbol name="checkmark.circle.fill" size={12} color={colors.primary} /><Text className="text-xs text-primary">Gegossen</Text></View>}
                    {entry.checklist.fertilized && <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full"><IconSymbol name="checkmark.circle.fill" size={12} color={colors.primary} /><Text className="text-xs text-primary">Gedüngt</Text></View>}
                    {entry.checklist.checked && <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full"><IconSymbol name="checkmark.circle.fill" size={12} color={colors.primary} /><Text className="text-xs text-primary">Kontrolliert</Text></View>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <View className="gap-0">
            {(Object.keys(PHASE_INFO) as GrowPhase[]).map((phase, idx) => {
              const progress = getPhaseProgress(phase);
              const isActive = phase === currentPhase;
              const isCompleted = progress.percent === 100;
              return (
                <View key={phase} className="flex-row">
                  <View className="w-12 items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isCompleted ? 'bg-success' : isActive ? 'bg-primary' : 'bg-border'}`}>
                      {isCompleted ? <IconSymbol name="checkmark" size={20} color="#fff" /> : <Text className="text-lg">{PHASE_INFO[phase].icon}</Text>}
                    </View>
                    {idx < 4 && <View className={`w-1 flex-1 min-h-[50px] ${isCompleted ? 'bg-success' : 'bg-border'}`} />}
                  </View>
                  <View className="flex-1 pb-4 pl-3">
                    <Text className={`text-base font-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-foreground'}`}>{PHASE_INFO[phase].name}</Text>
                    <View className="h-1.5 bg-background rounded-full overflow-hidden mt-1 mr-4">
                      <View className={`h-full rounded-full ${isCompleted ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progress.percent}%` }} />
                    </View>
                    <Text className="text-xs text-muted mt-1">{progress.completed}/{progress.total} Schritte</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-bold text-foreground">Neuer Eintrag</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} /></TouchableOpacity>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">Woche</Text>
                <View className="flex-row items-center bg-surface rounded-xl border border-border">
                  <TouchableOpacity className="p-3" onPress={() => setNewEntry(prev => ({ ...prev, week: Math.max(1, prev.week - 1) }))}><Text className="text-xl text-primary font-bold">-</Text></TouchableOpacity>
                  <Text className="flex-1 text-center text-lg font-semibold text-foreground">{newEntry.week}</Text>
                  <TouchableOpacity className="p-3" onPress={() => setNewEntry(prev => ({ ...prev, week: prev.week + 1 }))}><Text className="text-xl text-primary font-bold">+</Text></TouchableOpacity>
                </View>
              </View>
              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">Phase</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-1">
                    {(Object.keys(PHASE_INFO) as GrowPhase[]).map(phase => (
                      <TouchableOpacity
                        key={phase}
                        className={`px-3 py-2 rounded-lg ${newEntry.phase === phase ? 'bg-primary' : 'bg-surface border border-border'}`}
                        onPress={() => setNewEntry(prev => ({ ...prev, phase }))}
                      >
                        <Text className={`text-xs ${newEntry.phase === phase ? 'text-white' : 'text-foreground'}`}>{PHASE_INFO[phase].icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Checkliste</Text>
              <View className="flex-row gap-2">
                {[
                  { key: "watered" as const, label: "Gegossen" },
                  { key: "fertilized" as const, label: "Gedüngt" },
                  { key: "checked" as const, label: "Kontrolliert" },
                ].map(item => (
                  <TouchableOpacity
                    key={item.key}
                    className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-1 ${newEntry.checklist[item.key] ? 'bg-primary/20 border-primary' : 'border-border'}`}
                    onPress={() => toggleChecklist(item.key)}
                  >
                    {newEntry.checklist[item.key] && <IconSymbol name="checkmark.circle.fill" size={14} color={colors.primary} />}
                    <Text className={`text-xs ${newEntry.checklist[item.key] ? 'text-primary font-medium' : 'text-foreground'}`}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Notizen</Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                placeholder="Was ist passiert?"
                placeholderTextColor={colors.muted}
                value={newEntry.notes}
                onChangeText={(text) => setNewEntry(prev => ({ ...prev, notes: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity className="rounded-xl p-4 items-center bg-primary" onPress={addEntry}>
              <Text className="text-base font-semibold text-white">Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
