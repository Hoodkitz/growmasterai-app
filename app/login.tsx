import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { postAuth } from "@/lib/auth-mail-api";
import { useGoogleAuth } from "@/lib/google-auth";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, loginWithEmail, register, loading } = useAppAuth();
  const { signIn: signInWithGoogle, isLoading: googleLoading } =
    useGoogleAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSocialLogin = async (provider: "google") => {
    if (provider === "google") {
      try {
        const userInfo = await signInWithGoogle();
        if (userInfo) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        Alert.alert(
          "Fehler",
          error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.",
        );
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Fehler", "Bitte fülle alle Felder aus.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      Alert.alert(
        "Fehler",
        "Das Passwort muss mindestens 8 Zeichen lang sein.",
      );
      return;
    }

    if (mode === "register" && !name) {
      Alert.alert("Fehler", "Bitte gib deinen Namen ein.");
      return;
    }

    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await register(email, password, name);
      }
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Fehler",
        error instanceof Error && error.message
          ? error.message
          : "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
      );
    }
  };

  const handleForgotPassword = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(
        "E-Mail fehlt",
        "Bitte gib oben deine E-Mail-Adresse ein, dann tippe erneut auf „Passwort vergessen?“.",
      );
      return;
    }
    try {
      const res = await postAuth("forgot-password", { email: email.trim() });
      Alert.alert(
        "Prüfe dein Postfach",
        res.message ||
          "Falls ein Konto mit dieser E-Mail existiert, haben wir dir eine Nachricht gesendet.",
      );
    } catch (error) {
      Alert.alert(
        "Fehler",
        error instanceof Error ? error.message : "Anfrage fehlgeschlagen.",
      );
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-2xl bg-primary/20 items-center justify-center mb-4">
              <IconSymbol name="leaf.fill" size={40} color={colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              GrowMaster AI
            </Text>
            <Text className="text-base text-muted text-center">
              {mode === "login" ? "Willkommen zurück!" : "Erstelle dein Konto"}
            </Text>
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-4 items-center mb-4 flex-row justify-center gap-3"
            onPress={() => handleSocialLogin("google")}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <IconSymbol name="globe" size={20} color={colors.foreground} />
                <Text className="text-base font-semibold text-foreground">
                  Mit Google fortfahren
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-sm text-muted">oder</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Email Form */}
          <View className="gap-4 mb-6">
            {mode === "register" && (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Name
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                  placeholder="Dein Name"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                E-Mail
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground"
                placeholder="deine@email.de"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Passwort
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-surface border border-border rounded-xl p-4 text-foreground pr-12"
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <IconSymbol
                    name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    size={22}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {mode === "login" && (
            <TouchableOpacity
              className="items-end -mt-3 mb-4"
              onPress={handleForgotPassword}
            >
              <Text className="text-sm text-primary font-medium">
                Passwort vergessen?
              </Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 items-center mb-4"
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {mode === "login" ? "Anmelden" : "Registrieren"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Mode */}
          <TouchableOpacity
            className="items-center py-2"
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          >
            <Text className="text-base text-muted">
              {mode === "login" ? "Noch kein Konto? " : "Bereits registriert? "}
              <Text className="text-primary font-medium">
                {mode === "login" ? "Registrieren" : "Anmelden"}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Skip for now */}
          <TouchableOpacity
            className="items-center py-4 mt-4"
            onPress={() => router.replace("/(tabs)")}
          >
            <Text className="text-sm text-muted">Später anmelden</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="text-xs text-muted text-center mt-4 leading-5">
            Mit der Anmeldung akzeptierst du unsere{" "}
            <Text
              className="text-primary"
              onPress={() => router.push("/legal")}
            >
              Nutzungsbedingungen
            </Text>{" "}
            und{" "}
            <Text
              className="text-primary"
              onPress={() => router.push("/legal")}
            >
              Datenschutzrichtlinie
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
