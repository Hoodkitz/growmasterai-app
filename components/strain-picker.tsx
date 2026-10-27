import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  STRAINS_DATABASE,
  getTypeColor,
  getTypeLabel,
} from "@/lib/strains-data";

/** Pick a strain from the database, or fall back to a free-text name. */
export function StrainPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const colors = useColors();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STRAINS_DATABASE;
    return STRAINS_DATABASE.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.breeder.toLowerCase().includes(q) ||
        (s.genetics ?? "").toLowerCase().includes(q),
    );
  }, [query]);

  const trimmed = query.trim();
  const exact = STRAINS_DATABASE.some(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
  );

  const close = () => {
    setQuery("");
    onClose();
  };
  const pick = (name: string) => {
    setQuery("");
    onSelect(name);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={close}
      transparent={false}
    >
      <View className="flex-1 bg-background pt-12 px-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-foreground">
            Sorte wählen
          </Text>
          <TouchableOpacity onPress={close}>
            <IconSymbol
              name="xmark.circle.fill"
              size={28}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border mb-3"
          placeholder="Suchen (Name, Züchter, Genetik)…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {trimmed && !exact ? (
          <TouchableOpacity
            className="bg-primary/10 border border-primary rounded-xl p-3 mb-3"
            onPress={() => pick(trimmed)}
          >
            <Text className="text-sm font-semibold text-primary">
              „{trimmed}“ als eigene Sorte verwenden
            </Text>
            <Text className="text-xs text-muted">
              Ohne Sorten-Infos in der Pflanzenkarte
            </Text>
          </TouchableOpacity>
        ) : null}
        <FlatList
          data={results}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text className="text-sm text-muted text-center mt-6">
              Keine Treffer. Tippe oben auf „als eigene Sorte verwenden“.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="py-3 border-b border-border"
              onPress={() => pick(item.name)}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-foreground flex-shrink">
                  {item.name}
                </Text>
                {item.type ? (
                  <Text
                    className="text-xs"
                    style={{ color: getTypeColor(item.type) }}
                  >
                    {getTypeLabel(item.type)}
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-muted">
                {item.breeder}
                {item.floweringText ? ` · Blüte ${item.floweringText}` : ""}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}
