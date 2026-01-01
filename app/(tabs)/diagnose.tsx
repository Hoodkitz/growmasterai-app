import { useState, useRef, useEffect } from "react";
import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { UpgradePrompt, UsageIndicator } from "@/components/upgrade-prompt";
import { TIER_LIMITS, canUseDiagnosis } from "@/lib/subscription";
import { trpc } from "@/lib/trpc";

const { width, height } = Dimensions.get("window");

interface AnalysisOverlay {
  id: string;
  type: "cut" | "issue" | "healthy" | "tip";
  x: number;
  y: number;
  label: string;
  description: string;
  color: string;
}

interface DiagnosisResult {
  problem: string;
  recommendations: string[];
  careTips: string[];
  severity: "low" | "medium" | "high";
}

export default function DiagnoseScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tier, dailyDiagnoses, canDiagnose, useDiagnosis, remainingDiagnoses } = useSubscription();
  const limits = TIER_LIMITS[tier];
  const [permission, requestPermission] = useCameraPermissions();
  
  const [mode, setMode] = useState<"camera" | "gallery" | "result">("camera");
  const [facing, setFacing] = useState<CameraType>("back");
  const [liveAnalysisActive, setLiveAnalysisActive] = useState(false);
  const [overlays, setOverlays] = useState<AnalysisOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<AnalysisOverlay | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const diagnosisMutation = trpc.diagnosis.analyze.useMutation({
    onSuccess: (data) => {
      setDiagnosis(data);
      setMode("result");
    },
    onError: (error) => {
      console.error("Diagnosis error:", error);
      setDiagnosis({
        problem: "Fehler bei der Analyse. Bitte versuche es erneut.",
        recommendations: ["Stelle sicher, dass die Bilder klar und gut beleuchtet sind."],
        careTips: [],
        severity: "low",
      });
      setMode("result");
    },
  });

  // Pulse animation for live analysis
  useEffect(() => {
    if (liveAnalysisActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      scanLineAnim.setValue(0);
    }
  }, [liveAnalysisActive]);

  // Simulate live analysis overlays
  useEffect(() => {
    if (liveAnalysisActive && mode === "camera") {
      const interval = setInterval(() => {
        const mockOverlays: AnalysisOverlay[] = [
          {
            id: "1",
            type: "cut",
            x: 0.25 + Math.random() * 0.15,
            y: 0.2 + Math.random() * 0.1,
            label: "✂️ Schnitt empfohlen",
            description: "Entferne diesen Seitentrieb für besseren Ertrag am Hauptstamm. Dies fördert das vertikale Wachstum.",
            color: "#F59E0B",
          },
          {
            id: "2",
            type: "healthy",
            x: 0.5 + Math.random() * 0.1,
            y: 0.35 + Math.random() * 0.1,
            label: "✓ Gesund",
            description: "Dieser Bereich zeigt optimales Wachstum mit guter Blattfarbe und Struktur.",
            color: "#22C55E",
          },
          {
            id: "3",
            type: "tip",
            x: 0.65 + Math.random() * 0.1,
            y: 0.55 + Math.random() * 0.1,
            label: "💡 LST möglich",
            description: "Dieser Zweig eignet sich für Low Stress Training. Biege ihn vorsichtig nach außen.",
            color: "#3B82F6",
          },
        ];
        setOverlays(mockOverlays);
      }, 3000);
      
      return () => clearInterval(interval);
    } else {
      setOverlays([]);
    }
  }, [liveAnalysisActive, mode]);

  const canStartDiagnosis = canDiagnose();

  const toggleLiveAnalysis = () => {
    if (!canStartDiagnosis && !liveAnalysisActive) return;
    setLiveAnalysisActive(!liveAnalysisActive);
    setSelectedOverlay(null);
  };

  const takePicture = async () => {
    if (!cameraRef.current || !canStartDiagnosis) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      
      if (photo) {
        setImages([photo.uri]);
        await startDiagnosis([`data:image/jpeg;base64,${photo.base64}`]);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const pickImage = async () => {
    if (!canStartDiagnosis) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages(newImages);
      setMode("gallery");
    }
  };

  const startDiagnosis = async (base64Images?: string[]) => {
    const canUse = await useDiagnosis();
    if (!canUse) return;
    
    let imagesToAnalyze = base64Images;
    
    if (!imagesToAnalyze) {
      imagesToAnalyze = await Promise.all(
        images.map(async (uri) => {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
          } catch {
            return uri;
          }
        })
      );
    }

    diagnosisMutation.mutate({
      images: imagesToAnalyze,
      notes: notes || undefined,
    });
  };

  const resetDiagnosis = () => {
    setImages([]);
    setNotes("");
    setDiagnosis(null);
    setMode("camera");
    setLiveAnalysisActive(false);
    setOverlays([]);
    setSelectedOverlay(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return colors.error;
      case "medium": return colors.warning;
      default: return colors.success;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "high": return "Hoch";
      case "medium": return "Mittel";
      default: return "Niedrig";
    }
  };

  // Permission request screen
  if (!permission) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
          <IconSymbol name="camera.fill" size={40} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-foreground text-center mb-2">
          Kamera-Zugriff benötigt
        </Text>
        <Text className="text-base text-muted text-center mb-6">
          Um Pflanzen zu analysieren, benötigen wir Zugriff auf deine Kamera.
        </Text>
        <TouchableOpacity 
          className="bg-primary px-6 py-3 rounded-full"
          onPress={requestPermission}
        >
          <Text className="text-base font-semibold text-white">Zugriff erlauben</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Result view
  if (mode === "result" && diagnosis) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-6">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-foreground">Analyse-Ergebnis</Text>
              <Text className="text-base text-muted">KI-gestützte Pflanzendiagnose</Text>
            </View>

            <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                  <Text className="text-lg font-semibold text-foreground">Problem identifiziert</Text>
                </View>
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getSeverityColor(diagnosis.severity) + "30" }}
                >
                  <Text style={{ color: getSeverityColor(diagnosis.severity) }} className="text-sm font-medium">
                    {getSeverityLabel(diagnosis.severity)}
                  </Text>
                </View>
              </View>
              <Text className="text-base text-foreground leading-6">{diagnosis.problem}</Text>
            </View>

            {diagnosis.recommendations.length > 0 && (
              <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                <Text className="text-lg font-semibold text-foreground">Empfehlungen</Text>
                {diagnosis.recommendations.map((rec, index) => (
                  <View key={index} className="flex-row items-start gap-3">
                    <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mt-0.5">
                      <Text className="text-xs font-bold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-base text-foreground">{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {diagnosis.careTips.length > 0 && (
              <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                <Text className="text-lg font-semibold text-foreground">Pflege-Tipps</Text>
                {diagnosis.careTips.map((tip, index) => (
                  <View key={index} className="flex-row items-start gap-3">
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                    <Text className="flex-1 text-base text-foreground">{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              className="rounded-xl p-4 items-center bg-primary"
              onPress={resetDiagnosis}
            >
              <Text className="text-base font-semibold text-background">Neue Analyse</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Gallery mode
  if (mode === "gallery") {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-6">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={resetDiagnosis}>
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">Bilder analysieren</Text>
                <Text className="text-base text-muted">{images.length} Bild(er) ausgewählt</Text>
              </View>
            </View>

            {limits.diagnosesPerDay !== -1 && (
              <View className="bg-surface rounded-xl p-3 border border-border">
                <UsageIndicator 
                  used={dailyDiagnoses} 
                  limit={limits.diagnosesPerDay} 
                  label="Diagnosen heute"
                />
              </View>
            )}

            <View className="flex-row flex-wrap gap-2">
              {images.map((uri, index) => (
                <View key={index} className="relative">
                  <Image source={{ uri }} className="w-24 h-24 rounded-xl" />
                  <TouchableOpacity 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error items-center justify-center"
                    onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <IconSymbol name="xmark.circle.fill" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
              <Text className="text-base font-semibold text-foreground">Notizen (optional)</Text>
              <TextInput
                className="bg-background rounded-xl p-3 text-foreground min-h-[80px] border border-border"
                placeholder="Beschreibe Symptome oder Bedenken..."
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              className={`rounded-xl p-4 items-center ${canStartDiagnosis ? 'bg-primary' : 'bg-muted/30'}`}
              onPress={() => startDiagnosis()}
              disabled={diagnosisMutation.isPending || !canStartDiagnosis}
            >
              {diagnosisMutation.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#fff" />
                  <Text className="text-base font-semibold text-background">Analysiere...</Text>
                </View>
              ) : (
                <Text className={`text-base font-semibold ${canStartDiagnosis ? 'text-background' : 'text-muted'}`}>
                  Analyse starten
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Camera mode (default)
  return (
    <View className="flex-1 bg-black">
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFill} 
        facing={facing}
      >
        {/* Scan Line Animation */}
        {liveAnalysisActive && (
          <Animated.View 
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height - 250],
                  })
                }]
              }
            ]}
          />
        )}

        {/* Analysis Overlays */}
        {overlays.map((overlay) => (
          <TouchableOpacity
            key={overlay.id}
            style={[
              styles.overlay,
              {
                left: overlay.x * width - 20,
                top: overlay.y * (height - 200) + insets.top,
              }
            ]}
            onPress={() => setSelectedOverlay(selectedOverlay?.id === overlay.id ? null : overlay)}
          >
            <Animated.View 
              style={[
                styles.overlayDot,
                { 
                  backgroundColor: overlay.color,
                  transform: [{ scale: selectedOverlay?.id === overlay.id ? 1.3 : 1 }]
                }
              ]}
            >
              {overlay.type === "cut" && <IconSymbol name="scissors" size={16} color="#fff" />}
              {overlay.type === "healthy" && <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />}
              {overlay.type === "tip" && <IconSymbol name="sparkles" size={16} color="#fff" />}
              {overlay.type === "issue" && <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#fff" />}
            </Animated.View>
            <View style={[styles.overlayPulse, { borderColor: overlay.color }]} />
          </TouchableOpacity>
        ))}

        {/* Selected Overlay Info */}
        {selectedOverlay && (
          <View style={[styles.overlayInfo, { bottom: insets.bottom + 200 }]}>
            <View className="flex-row items-center gap-2 mb-2">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: selectedOverlay.color }}
              >
                {selectedOverlay.type === "cut" && <IconSymbol name="scissors" size={16} color="#fff" />}
                {selectedOverlay.type === "healthy" && <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />}
                {selectedOverlay.type === "tip" && <IconSymbol name="sparkles" size={16} color="#fff" />}
              </View>
              <Text className="text-base font-bold text-white flex-1">{selectedOverlay.label}</Text>
              <TouchableOpacity onPress={() => setSelectedOverlay(null)}>
                <IconSymbol name="xmark.circle.fill" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-white/80 leading-5">{selectedOverlay.description}</Text>
          </View>
        )}

        {/* Corner Frame */}
        <View style={styles.frameContainer}>
          <View style={[styles.corner, styles.topLeft, { borderColor: liveAnalysisActive ? "#10B981" : "#fff" }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: liveAnalysisActive ? "#10B981" : "#fff" }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: liveAnalysisActive ? "#10B981" : "#fff" }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: liveAnalysisActive ? "#10B981" : "#fff" }]} />
        </View>
      </CameraView>

      {/* Top Header */}
      <View 
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          onPress={() => router.push("/(tabs)")}
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
          {liveAnalysisActive && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View className="w-2 h-2 rounded-full bg-error" />
            </Animated.View>
          )}
          <Text className="text-sm font-medium text-white">
            {liveAnalysisActive ? "Live-Analyse aktiv" : "Kamera bereit"}
          </Text>
        </View>
        
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
        >
          <IconSymbol name="arrow.triangle.2.circlepath" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View 
        className="absolute left-0 right-0 bg-black/80"
        style={{ bottom: 0, paddingBottom: insets.bottom + 16 }}
      >
        {!canStartDiagnosis && (
          <View className="px-4 mb-4">
            <UpgradePrompt 
              feature="Diagnosen" 
              limit={limits.diagnosesPerDay}
              remaining={remainingDiagnoses}
            />
          </View>
        )}
        
        <View className="px-4">
          {/* Live Analysis Toggle */}
          <View className="flex-row justify-center gap-4 mb-4">
            <TouchableOpacity 
              className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${liveAnalysisActive ? "bg-primary" : "bg-white/20"}`}
              onPress={toggleLiveAnalysis}
              disabled={!canStartDiagnosis}
              style={{ opacity: canStartDiagnosis ? 1 : 0.5 }}
            >
              <IconSymbol name="viewfinder" size={18} color="#fff" />
              <Text className="text-sm font-medium text-white">
                {liveAnalysisActive ? "Live-Analyse stoppen" : "Live-Analyse starten"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Capture Controls */}
          <View className="flex-row items-center justify-center gap-8">
            <TouchableOpacity 
              className="w-14 h-14 rounded-full bg-white/20 items-center justify-center"
              onPress={pickImage}
              disabled={!canStartDiagnosis}
              style={{ opacity: canStartDiagnosis ? 1 : 0.5 }}
            >
              <IconSymbol name="photo.fill" size={26} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-20 h-20 rounded-full bg-white items-center justify-center"
              onPress={takePicture}
              disabled={!canStartDiagnosis || diagnosisMutation.isPending}
              style={{ opacity: canStartDiagnosis ? 1 : 0.5 }}
            >
              {diagnosisMutation.isPending ? (
                <ActivityIndicator color="#000" size="large" />
              ) : (
                <View className="w-16 h-16 rounded-full border-4 border-black/20" />
              )}
            </TouchableOpacity>
            
            <View className="w-14 h-14" />
          </View>
          
          {/* Usage Info */}
          {limits.diagnosesPerDay !== -1 && (
            <View className="mt-4 items-center">
              <Text className="text-sm text-white/60">
                {remainingDiagnoses} von {limits.diagnosesPerDay} Scans übrig
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scanLine: {
    position: "absolute",
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  overlay: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlayPulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    opacity: 0.5,
  },
  overlayInfo: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: 16,
    padding: 16,
  },
  frameContainer: {
    position: "absolute",
    top: 100,
    left: 40,
    right: 40,
    bottom: 200,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
});
