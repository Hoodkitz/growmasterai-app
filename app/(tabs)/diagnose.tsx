import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, TextInput, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface DiagnosisResult {
  problem: string;
  recommendations: string[];
  careTips: string[];
  severity: "low" | "medium" | "high";
}

export default function DiagnoseScreen() {
  const colors = useColors();
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const diagnosisMutation = trpc.diagnosis.analyze.useMutation({
    onSuccess: (data) => {
      setDiagnosis(data);
    },
    onError: (error) => {
      console.error("Diagnosis error:", error);
      setDiagnosis({
        problem: "Fehler bei der Analyse. Bitte versuche es erneut.",
        recommendations: ["Stelle sicher, dass die Bilder klar und gut beleuchtet sind."],
        careTips: [],
        severity: "low",
      });
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 4));
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startDiagnosis = async () => {
    if (images.length === 0) return;
    
    // Convert images to base64
    const base64Images = await Promise.all(
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

    diagnosisMutation.mutate({
      images: base64Images,
      notes: notes || undefined,
    });
  };

  const resetDiagnosis = () => {
    setImages([]);
    setNotes("");
    setDiagnosis(null);
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

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">Pflanzen-Diagnose</Text>
            <Text className="text-base text-muted">
              Lade Fotos hoch für eine KI-gestützte Analyse
            </Text>
          </View>

          {!diagnosis ? (
            <>
              {/* Image Upload Section */}
              <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
                <Text className="text-base font-semibold text-foreground">Bilder (max. 4)</Text>
                
                {images.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {images.map((uri, index) => (
                      <View key={index} className="relative">
                        <Image 
                          source={{ uri }} 
                          className="w-20 h-20 rounded-lg"
                        />
                        <TouchableOpacity 
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error items-center justify-center"
                          onPress={() => removeImage(index)}
                        >
                          <IconSymbol name="xmark.circle.fill" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {images.length < 4 && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity 
                      className="flex-1 bg-primary/10 rounded-xl p-4 items-center gap-2 active:opacity-80"
                      onPress={takePhoto}
                    >
                      <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                      <Text className="text-sm font-medium text-primary">Foto aufnehmen</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 bg-primary/10 rounded-xl p-4 items-center gap-2 active:opacity-80"
                      onPress={pickImage}
                    >
                      <IconSymbol name="photo.fill" size={24} color={colors.primary} />
                      <Text className="text-sm font-medium text-primary">Aus Galerie</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Notes Section */}
              <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                <Text className="text-base font-semibold text-foreground">Zusätzliche Notizen (optional)</Text>
                <TextInput
                  className="bg-background rounded-xl p-3 text-foreground min-h-[100px] border border-border"
                  placeholder="Beschreibe Symptome, Wachstumsphase oder Bedenken..."
                  placeholderTextColor={colors.muted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Start Button */}
              <TouchableOpacity 
                className={`rounded-xl p-4 items-center ${images.length > 0 ? 'bg-primary' : 'bg-muted/30'}`}
                onPress={startDiagnosis}
                disabled={images.length === 0 || diagnosisMutation.isPending}
              >
                {diagnosisMutation.isPending ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-base font-semibold text-background">Analysiere...</Text>
                  </View>
                ) : (
                  <Text className={`text-base font-semibold ${images.length > 0 ? 'text-background' : 'text-muted'}`}>
                    Diagnose starten
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Diagnosis Result */}
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

              {/* Recommendations */}
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

              {/* Care Tips */}
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

              {/* New Diagnosis Button */}
              <TouchableOpacity 
                className="rounded-xl p-4 items-center bg-primary"
                onPress={resetDiagnosis}
              >
                <Text className="text-base font-semibold text-background">Neue Diagnose</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
