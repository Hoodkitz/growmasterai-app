import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { postAuth } from "@/lib/auth-mail-api";

/** Deep link: growmasterai://reset-password?token=... (or <web>/reset-password?token=...) */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      Alert.alert("Fehler", "Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Fehler", "Die Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      await postAuth("reset-password", { token, password });
      setDone(true);
    } catch (e) {
      Alert.alert("Fehler", e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-bold text-foreground mb-2">Neues Passwort</Text>

          {!token ? (
            <>
              <Text className="text-base text-muted mb-6">
                Dieser Link ist ungültig. Bitte fordere auf dem Anmeldebildschirm einen neuen Link an.
              </Text>
              <TouchableOpacity className="bg-primary rounded-xl p-4 items-center" onPress={() => router.replace("/login")}>
                <Text className="text-base font-semibold text-white">Zur Anmeldung</Text>
              </TouchableOpacity>
            </>
          ) : done ? (
            <>
              <Text className="text-base text-muted mb-6">Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</Text>
              <TouchableOpacity className="bg-primary rounded-xl p-4 items-center" onPress={() => router.replace("/login")}>
                <Text className="text-base font-semibold text-white">Zur Anmeldung</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-base text-muted mb-6">Wähle ein neues Passwort mit mindestens 8 Zeichen.</Text>
              <View className="gap-4 mb-6">
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Neues Passwort</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl p-4 text-foreground"
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Passwort bestätigen</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl p-4 text-foreground"
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <TouchableOpacity className="bg-primary rounded-xl p-4 items-center" onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Passwort speichern</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
