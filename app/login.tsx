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

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, loginWithEmail, register, loading } = useAppAuth();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Fehler", "Bitte fülle alle Felder aus.");
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
      Alert.alert("Fehler", "Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      await login(provider);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Fehler", "Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
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
            <Text className="text-3xl font-bold text-foreground mb-2">GrowMaster AI</Text>
            <Text className="text-base text-muted text-center">
              {mode === "login" ? "Willkommen zurück!" : "Erstelle dein Konto"}
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View className="gap-3 mb-6">
            <TouchableOpacity 
              className="flex-row items-center justify-center gap-3 bg-surface border border-border rounded-xl p-4"
              onPress={() => handleSocialLogin("google")}
              disabled={loading}
            >
              <Text className="text-2xl">🔵</Text>
              <Text className="text-base font-medium text-foreground">Mit Google fortfahren</Text>
            </TouchableOpacity>
            
            {Platform.OS === "ios" && (
              <TouchableOpacity 
                className="flex-row items-center justify-center gap-3 bg-foreground rounded-xl p-4"
                onPress={() => handleSocialLogin("apple")}
                disabled={loading}
              >
                <Text className="text-2xl">🍎</Text>
                <Text className="text-base font-medium text-background">Mit Apple fortfahren</Text>
              </TouchableOpacity>
            )}
          </View>

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
                <Text className="text-sm font-medium text-foreground mb-2">Name</Text>
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
              <Text className="text-sm font-medium text-foreground mb-2">E-Mail</Text>
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
              <Text className="text-sm font-medium text-foreground mb-2">Passwort</Text>
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
            <Text className="text-primary">Nutzungsbedingungen</Text> und{" "}
            <Text className="text-primary">Datenschutzrichtlinie</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
