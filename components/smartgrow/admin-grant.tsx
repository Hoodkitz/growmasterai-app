import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { trpc } from "@/lib/trpc";

/** Admin: Add-on „Smart Grow“ per E-Mail freischalten (Monate) oder entziehen (0). */
export function AdminSmartGrowGrant() {
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("12");
  const grant = trpc.smartGrow.adminGrant.useMutation({
    onSuccess: (r) => {
      Alert.alert(
        "Gespeichert",
        r.until
          ? `Smart Grow bis ${new Date(r.until).toLocaleDateString("de-DE")}`
          : "Smart Grow entzogen",
      );
      setEmail("");
    },
    onError: (e) => Alert.alert("Fehler", e.message),
  });
  return (
    <View className="bg-surface rounded-xl p-4 border border-border gap-2 mb-3">
      <Text className="text-base font-bold text-foreground">
        Add-on „Smart Grow“ vergeben
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-Mail"
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-background rounded-lg p-3 text-foreground border border-border"
      />
      <TextInput
        value={months}
        onChangeText={setMonths}
        placeholder="Monate (0 = entziehen)"
        keyboardType="number-pad"
        className="bg-background rounded-lg p-3 text-foreground border border-border"
      />
      <TouchableOpacity
        className="bg-primary rounded-lg p-3 items-center"
        disabled={grant.isPending}
        onPress={() =>
          grant.mutate({
            email: email.trim(),
            months: Math.max(0, Math.min(120, parseInt(months, 10) || 0)),
          })
        }
      >
        <Text className="text-white font-bold">Speichern</Text>
      </TouchableOpacity>
    </View>
  );
}
