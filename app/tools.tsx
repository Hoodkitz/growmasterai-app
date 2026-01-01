import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import {
  getMoonPhase,
  calculateVPD,
  calculateNutrients,
  getLightSchedule,
  estimateYield,
  calculateWatering,
} from "@/lib/grow-tools";

type ToolTab = "calendar" | "vpd" | "nutrients" | "light" | "yield" | "water";

export default function ToolsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();
  
  const [activeTab, setActiveTab] = useState<ToolTab>("calendar");
  
  // VPD Calculator State
  const [vpdTemp, setVpdTemp] = useState("25");
  const [vpdHumidity, setVpdHumidity] = useState("60");
  
  // Nutrient Calculator State
  const [nutrientPhase, setNutrientPhase] = useState<"seedling" | "vegetative" | "flowering" | "late-flowering">("vegetative");
  const [waterLiters, setWaterLiters] = useState("10");
  const [nutrientStrength, setNutrientStrength] = useState("100");
  
  // Light Calculator State
  const [lightPhase, setLightPhase] = useState<"seedling" | "vegetative" | "flowering" | "autoflower">("vegetative");
  const [ppfd, setPpfd] = useState("400");
  
  // Yield Estimator State
  const [lightWatts, setLightWatts] = useState("400");
  const [plantCount, setPlantCount] = useState("4");
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "expert">("intermediate");
  const [growMethod, setGrowMethod] = useState<"soil" | "hydro" | "coco">("soil");
  
  // Watering Calculator State
  const [potSize, setPotSize] = useState("11");
  const [waterPhase, setWaterPhase] = useState<"seedling" | "vegetative" | "flowering">("vegetative");
  const [envTemp, setEnvTemp] = useState("24");
  const [envHumidity, setEnvHumidity] = useState("55");

  const moonPhase = getMoonPhase();
  const vpdResult = calculateVPD(parseFloat(vpdTemp) || 25, parseFloat(vpdHumidity) || 60);
  const nutrients = calculateNutrients(nutrientPhase, parseFloat(waterLiters) || 10, parseFloat(nutrientStrength) || 100);
  const lightSchedule = getLightSchedule(lightPhase, parseFloat(ppfd) || 400);
  const yieldEstimate = estimateYield(parseFloat(lightWatts) || 400, parseInt(plantCount) || 4, experience, growMethod);
  const wateringSchedule = calculateWatering(parseFloat(potSize) || 11, waterPhase, parseFloat(envTemp) || 24, parseFloat(envHumidity) || 55);

  const TABS: { id: ToolTab; label: string; icon: string; premium: boolean }[] = [
    { id: "calendar", label: "Kalender", icon: "🌙", premium: false },
    { id: "vpd", label: "VPD", icon: "💨", premium: false },
    { id: "nutrients", label: "Nährstoffe", icon: "🧪", premium: true },
    { id: "light", label: "Licht", icon: "💡", premium: false },
    { id: "yield", label: "Ertrag", icon: "📊", premium: true },
    { id: "water", label: "Gießen", icon: "💧", premium: false },
  ];

  const isLocked = (tab: ToolTab) => {
    const tabInfo = TABS.find(t => t.id === tab);
    return tabInfo?.premium && tier === "free";
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Grow Tools</Text>
        <View className="w-10" />
      </View>

      {/* Tab Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
        <View className="flex-row gap-2">
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${
                activeTab === tab.id ? 'bg-primary' : 'bg-surface border border-border'
              } ${isLocked(tab.id) ? 'opacity-60' : ''}`}
              onPress={() => !isLocked(tab.id) && setActiveTab(tab.id)}
            >
              <Text>{tab.icon}</Text>
              <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-foreground'}`}>
                {tab.label}
              </Text>
              {isLocked(tab.id) && <IconSymbol name="lock.fill" size={12} color={colors.muted} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Moon Calendar */}
        {activeTab === "calendar" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-6xl mb-4">{moonPhase.emoji}</Text>
              <Text className="text-2xl font-bold text-foreground">{moonPhase.name}</Text>
              <Text className="text-sm text-muted mt-1">{moonPhase.description}</Text>
              <View className="w-full h-2 bg-background rounded-full mt-4 overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: `${moonPhase.percentage}%` }} />
              </View>
              <Text className="text-xs text-muted mt-2">{moonPhase.percentage}% beleuchtet</Text>
            </View>
            
            <View className="bg-primary/20 rounded-2xl p-4 border border-primary">
              <Text className="text-base font-bold text-primary mb-2">🌱 Grow-Tipp für heute</Text>
              <Text className="text-sm text-foreground">{moonPhase.growTip}</Text>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-bold text-foreground mb-3">Mondphasen-Guide</Text>
              {[
                { emoji: "🌑", name: "Neumond", tip: "Wurzelarbeiten, Umpflanzen" },
                { emoji: "🌒", name: "Zunehmend", tip: "Aussaat, Stecklinge" },
                { emoji: "🌕", name: "Vollmond", tip: "Ernte, Blattdüngung" },
                { emoji: "🌘", name: "Abnehmend", tip: "Beschneiden, Ruhe" },
              ].map((phase, i) => (
                <View key={i} className="flex-row items-center gap-3 py-2 border-b border-border last:border-0">
                  <Text className="text-2xl">{phase.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{phase.name}</Text>
                    <Text className="text-xs text-muted">{phase.tip}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* VPD Calculator */}
        {activeTab === "vpd" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">VPD Rechner</Text>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Temperatur (°C)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center text-lg"
                    value={vpdTemp}
                    onChangeText={setVpdTemp}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Luftfeuchte (%)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center text-lg"
                    value={vpdHumidity}
                    onChangeText={setVpdHumidity}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            </View>

            <View className={`bg-surface rounded-2xl p-6 border items-center ${
              vpdResult.status === "optimal" ? "border-success" : vpdResult.status === "low" ? "border-warning" : "border-error"
            }`}>
              <Text className="text-5xl font-bold text-primary">{vpdResult.vpd}</Text>
              <Text className="text-sm text-muted">kPa</Text>
              <View className={`px-4 py-1 rounded-full mt-3 ${
                vpdResult.status === "optimal" ? "bg-success/20" : vpdResult.status === "low" ? "bg-warning/20" : "bg-error/20"
              }`}>
                <Text className={`text-sm font-medium ${
                  vpdResult.status === "optimal" ? "text-success" : vpdResult.status === "low" ? "text-warning" : "text-error"
                }`}>
                  {vpdResult.status === "optimal" ? "✓ Optimal" : vpdResult.status === "low" ? "⚠ Zu niedrig" : "⚠ Zu hoch"}
                </Text>
              </View>
            </View>

            <View className="bg-primary/20 rounded-2xl p-4 border border-primary">
              <Text className="text-sm text-foreground">{vpdResult.recommendation}</Text>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-bold text-foreground mb-3">VPD Zielwerte</Text>
              {[
                { phase: "Sämlinge/Klone", range: "0.4 - 0.8 kPa" },
                { phase: "Vegetativ", range: "0.8 - 1.2 kPa" },
                { phase: "Blüte (früh)", range: "1.0 - 1.4 kPa" },
                { phase: "Blüte (spät)", range: "1.2 - 1.6 kPa" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between py-2 border-b border-border last:border-0">
                  <Text className="text-sm text-foreground">{item.phase}</Text>
                  <Text className="text-sm font-medium text-primary">{item.range}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nutrient Calculator */}
        {activeTab === "nutrients" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">Nährstoff-Rechner</Text>
              
              <View>
                <Text className="text-sm text-muted mb-2">Wachstumsphase</Text>
                <View className="flex-row gap-2">
                  {(["seedling", "vegetative", "flowering", "late-flowering"] as const).map(phase => (
                    <TouchableOpacity
                      key={phase}
                      className={`flex-1 py-2 rounded-lg ${nutrientPhase === phase ? 'bg-primary' : 'bg-background border border-border'}`}
                      onPress={() => setNutrientPhase(phase)}
                    >
                      <Text className={`text-xs text-center ${nutrientPhase === phase ? 'text-white' : 'text-foreground'}`}>
                        {phase === "seedling" ? "Sämling" : phase === "vegetative" ? "Veg" : phase === "flowering" ? "Blüte" : "Spät"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Wasser (L)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={waterLiters}
                    onChangeText={setWaterLiters}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Stärke (%)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={nutrientStrength}
                    onChangeText={setNutrientStrength}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-bold text-foreground mb-3">Empfohlene Dosierung</Text>
              <View className="gap-2">
                {[
                  { label: "Stickstoff (N)", value: nutrients.nitrogen, color: "#22C55E" },
                  { label: "Phosphor (P)", value: nutrients.phosphorus, color: "#F59E0B" },
                  { label: "Kalium (K)", value: nutrients.potassium, color: "#3B82F6" },
                  { label: "Calcium (Ca)", value: nutrients.calcium, color: "#8B5CF6" },
                  { label: "Magnesium (Mg)", value: nutrients.magnesium, color: "#EC4899" },
                ].map((item, i) => (
                  <View key={i} className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-foreground">{item.label}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className="w-16 h-2 bg-background rounded-full overflow-hidden">
                        <View className="h-full rounded-full" style={{ width: `${Math.min(item.value * 20, 100)}%`, backgroundColor: item.color }} />
                      </View>
                      <Text className="text-sm font-medium text-foreground w-12 text-right">{item.value} ml</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="flex-row justify-between mt-4 pt-4 border-t border-border">
                <Text className="text-sm text-muted">Ziel EC: {nutrients.ec} mS/cm</Text>
                <Text className="text-sm text-muted">Ziel pH: {nutrients.ph}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Light Schedule */}
        {activeTab === "light" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">Licht-Zeitplan</Text>
              
              <View>
                <Text className="text-sm text-muted mb-2">Wachstumsphase</Text>
                <View className="flex-row gap-2">
                  {(["seedling", "vegetative", "flowering", "autoflower"] as const).map(phase => (
                    <TouchableOpacity
                      key={phase}
                      className={`flex-1 py-2 rounded-lg ${lightPhase === phase ? 'bg-primary' : 'bg-background border border-border'}`}
                      onPress={() => setLightPhase(phase)}
                    >
                      <Text className={`text-xs text-center ${lightPhase === phase ? 'text-white' : 'text-foreground'}`}>
                        {phase === "seedling" ? "Sämling" : phase === "vegetative" ? "Veg" : phase === "flowering" ? "Blüte" : "Auto"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">PPFD (μmol/m²/s)</Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                  value={ppfd}
                  onChangeText={setPpfd}
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <View className="flex-row items-center gap-8">
                <View className="items-center">
                  <Text className="text-4xl">☀️</Text>
                  <Text className="text-3xl font-bold text-foreground mt-2">{lightSchedule.lightHours}h</Text>
                  <Text className="text-sm text-muted">Licht</Text>
                </View>
                <View className="items-center">
                  <Text className="text-4xl">🌙</Text>
                  <Text className="text-3xl font-bold text-foreground mt-2">{lightSchedule.darkHours}h</Text>
                  <Text className="text-sm text-muted">Dunkel</Text>
                </View>
              </View>
              <View className="bg-primary/20 px-4 py-2 rounded-full mt-4">
                <Text className="text-sm font-medium text-primary">DLI: {lightSchedule.dli} mol/m²/Tag</Text>
              </View>
            </View>

            <View className="bg-primary/20 rounded-2xl p-4 border border-primary">
              <Text className="text-sm text-foreground">{lightSchedule.recommendation}</Text>
            </View>
          </View>
        )}

        {/* Yield Estimator */}
        {activeTab === "yield" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">Ertrags-Schätzer</Text>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Licht (Watt)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={lightWatts}
                    onChangeText={setLightWatts}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Pflanzen</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={plantCount}
                    onChangeText={setPlantCount}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">Erfahrung</Text>
                <View className="flex-row gap-2">
                  {(["beginner", "intermediate", "expert"] as const).map(exp => (
                    <TouchableOpacity
                      key={exp}
                      className={`flex-1 py-2 rounded-lg ${experience === exp ? 'bg-primary' : 'bg-background border border-border'}`}
                      onPress={() => setExperience(exp)}
                    >
                      <Text className={`text-xs text-center ${experience === exp ? 'text-white' : 'text-foreground'}`}>
                        {exp === "beginner" ? "Anfänger" : exp === "intermediate" ? "Mittel" : "Experte"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">Anbaumethode</Text>
                <View className="flex-row gap-2">
                  {(["soil", "coco", "hydro"] as const).map(method => (
                    <TouchableOpacity
                      key={method}
                      className={`flex-1 py-2 rounded-lg ${growMethod === method ? 'bg-primary' : 'bg-background border border-border'}`}
                      onPress={() => setGrowMethod(method)}
                    >
                      <Text className={`text-xs text-center ${growMethod === method ? 'text-white' : 'text-foreground'}`}>
                        {method === "soil" ? "Erde" : method === "coco" ? "Coco" : "Hydro"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-6 border border-success items-center">
              <Text className="text-sm text-muted">Geschätzter Ertrag</Text>
              <Text className="text-4xl font-bold text-success mt-2">{yieldEstimate.avgGrams}g</Text>
              <Text className="text-sm text-muted mt-1">{yieldEstimate.minGrams}g - {yieldEstimate.maxGrams}g</Text>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-bold text-foreground mb-3">Einflussfaktoren</Text>
              {yieldEstimate.factors.map((factor, i) => (
                <View key={i} className="flex-row justify-between py-2 border-b border-border last:border-0">
                  <Text className="text-sm text-foreground">{factor.name}</Text>
                  <Text className="text-sm text-muted">{factor.impact}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Watering Calculator */}
        {activeTab === "water" && (
          <View className="gap-4">
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">Gieß-Rechner</Text>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Topfgröße (L)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={potSize}
                    onChangeText={setPotSize}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-2">Temperatur (°C)</Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border text-center"
                    value={envTemp}
                    onChangeText={setEnvTemp}
                    keyboardType="numeric"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm text-muted mb-2">Phase</Text>
                <View className="flex-row gap-2">
                  {(["seedling", "vegetative", "flowering"] as const).map(phase => (
                    <TouchableOpacity
                      key={phase}
                      className={`flex-1 py-2 rounded-lg ${waterPhase === phase ? 'bg-primary' : 'bg-background border border-border'}`}
                      onPress={() => setWaterPhase(phase)}
                    >
                      <Text className={`text-xs text-center ${waterPhase === phase ? 'text-white' : 'text-foreground'}`}>
                        {phase === "seedling" ? "Sämling" : phase === "vegetative" ? "Veg" : "Blüte"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-6 border border-primary items-center">
              <View className="flex-row items-center gap-8">
                <View className="items-center">
                  <Text className="text-4xl">💧</Text>
                  <Text className="text-3xl font-bold text-foreground mt-2">{wateringSchedule.amountMl}ml</Text>
                  <Text className="text-sm text-muted">pro Gießen</Text>
                </View>
                <View className="items-center">
                  <Text className="text-4xl">📅</Text>
                  <Text className="text-3xl font-bold text-foreground mt-2">alle {wateringSchedule.frequencyDays}</Text>
                  <Text className="text-sm text-muted">Tage</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-bold text-foreground mb-3">Tipps</Text>
              {wateringSchedule.tips.map((tip, i) => (
                <View key={i} className="flex-row items-start gap-2 py-1">
                  <Text className="text-primary">•</Text>
                  <Text className="text-sm text-foreground flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>
    </ScreenContainer>
  );
}
