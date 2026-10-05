import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { postAuth } from "@/lib/auth-mail-api";

/** Deep link: growmasterai://verify-email?token=... */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Dieser Link ist ungültig.");

  useEffect(() => {
    if (!token) return;
    postAuth("verify-email", { token })
      .then(() => setState("ok"))
      .catch((e) => {
        setMessage(e instanceof Error ? e.message : "Verifizierung fehlgeschlagen.");
        setState("error");
      });
  }, [token]);

  return (
    <View className="flex-1 bg-background items-center justify-center p-6" style={{ paddingTop: insets.top }}>
      {state === "loading" && <ActivityIndicator />}
      {state === "ok" && <Text className="text-xl font-semibold text-foreground mb-2 text-center">E-Mail-Adresse bestätigt ✓</Text>}
      {state === "error" && <Text className="text-base text-muted mb-4 text-center">{message}</Text>}
      {state !== "loading" && (
        <TouchableOpacity className="bg-primary rounded-xl px-6 py-4 mt-4" onPress={() => router.replace("/(tabs)")}>
          <Text className="text-base font-semibold text-white">Weiter zur App</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
