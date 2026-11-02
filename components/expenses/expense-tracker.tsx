/**
 * Expense Tracker Component
 * Track and visualize grow expenses
 */

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import {
  exportExpensesToCSV,
  exportExpensesToPDF,
  shareFile,
} from "@/lib/export-service";
import {
  Expense,
  calculateTotalExpenses,
  getExpenseBreakdown,
  analyzeProfitability,
} from "@/lib/cost-tracking";

interface ExpenseTrackerProps {
  plantId?: string;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  yieldGrams?: number;
}

export function ExpenseTracker({
  plantId,
  expenses,
  onAddExpense,
  yieldGrams,
}: ExpenseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("nutrients");
  const [exporting, setExporting] = useState(false);

  const handleExport = async (kind: "csv" | "pdf") => {
    if (expenses.length === 0) {
      Alert.alert(
        "Nichts zu exportieren",
        "Trage zuerst mindestens eine Ausgabe ein.",
      );
      return;
    }
    setExporting(true);
    try {
      const name = plantId ? `expenses_${plantId}` : "expenses";
      const path =
        kind === "csv"
          ? await exportExpensesToCSV(expenses, name)
          : await exportExpensesToPDF(expenses, name);
      if (path) await shareFile(path);
    } catch (e) {
      Alert.alert(
        "Export fehlgeschlagen",
        e instanceof Error ? e.message : "Unbekannter Fehler",
      );
    } finally {
      setExporting(false);
    }
  };

  const total = calculateTotalExpenses(expenses);
  const breakdown = getExpenseBreakdown(expenses);
  const profitAnalysis = yieldGrams
    ? analyzeProfitability(expenses, yieldGrams)
    : null;

  const categories: {
    key: Expense["category"];
    label: string;
    icon: string;
  }[] = [
    { key: "seeds", label: "Saatgut", icon: "🌱" },
    { key: "nutrients", label: "Dünger", icon: "🌿" },
    { key: "lights", label: "Beleuchtung", icon: "💡" },
    { key: "equipment", label: "Ausstattung", icon: "🔧" },
    { key: "electricity", label: "Strom", icon: "⚡" },
    { key: "water", label: "Wasser", icon: "💧" },
    { key: "other", label: "Sonstiges", icon: "📦" },
  ];

  const handleAddExpense = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !description.trim()) {
      Alert.alert(
        "Ungültige Eingabe",
        "Bitte gültigen Betrag und Beschreibung eingeben.",
      );
      return;
    }

    onAddExpense({
      plantId,
      category,
      description: description.trim(),
      amount: parsedAmount,
      currency: "USD",
      date: new Date(),
    });

    // Reset form
    setAmount("");
    setDescription("");
    setShowAddForm(false);
  };

  return (
    <View className="flex-1">
      {/* Summary Cards */}
      <View className="flex-row mb-4">
        <View className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-4 mr-2">
          <Text className="text-sm text-muted mb-1">Gesamtausgaben</Text>
          <Text className="text-2xl font-bold text-primary">
            {total.toFixed(2)} €
          </Text>
        </View>

        {profitAnalysis && (
          <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <Text className="text-sm text-muted mb-1">Kosten/Gramm</Text>
            <Text className="text-2xl font-bold text-green-600">
              {profitAnalysis.costPerGram.toFixed(2)} €
            </Text>
          </View>
        )}
      </View>

      {/* ROI Card */}
      {profitAnalysis && (
        <View
          className={`p-4 rounded-xl mb-4 ${profitAnalysis.roi > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}
        >
          <Text className="text-lg font-bold mb-2">
            ROI: {profitAnalysis.roi > 0 ? "+" : ""}
            {profitAnalysis.roi}%
          </Text>
          <Text className="text-sm text-muted">
            Marktwert: {profitAnalysis.marketValue.toFixed(2)} € • Gewinn:{" "}
            {profitAnalysis.profit.toFixed(2)} €
          </Text>
        </View>
      )}

      {/* Export */}
      <View className="flex-row mb-4 gap-2">
        <TouchableOpacity
          className="flex-1 bg-surface border border-border rounded-xl py-3"
          disabled={exporting}
          onPress={() => handleExport("csv")}
        >
          <Text className="text-center font-semibold text-foreground">
            {exporting ? "..." : "CSV exportieren"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-surface border border-border rounded-xl py-3"
          disabled={exporting}
          onPress={() => handleExport("pdf")}
        >
          <Text className="text-center font-semibold text-foreground">
            {exporting ? "..." : "PDF exportieren"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Breakdown */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">
          Ausgaben nach Kategorie
        </Text>
        {breakdown.map((item) => (
          <View key={item.category} className="flex-row items-center mb-3">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-base text-foreground capitalize flex-1">
                  {item.category}
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {item.amount.toFixed(2)} €
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  className="h-full"
                />
              </View>
            </View>
            <Text className="text-xs text-muted ml-2 w-12 text-right">
              {item.percentage}%
            </Text>
          </View>
        ))}
      </View>

      {/* Ausgabe hinzufügen Button/Form */}
      {showAddForm ? (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            Ausgabe hinzufügen
          </Text>

          {/* Category Selection */}
          <Text className="text-sm font-semibold text-foreground mb-2">
            Kategorie
          </Text>
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                className={`mr-2 px-4 py-2 rounded-lg ${category === cat.key ? "bg-primary" : "bg-border"}`}
              >
                <Text
                  className={
                    category === cat.key ? "text-white" : "text-foreground"
                  }
                >
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount Input */}
          <Text className="text-sm font-semibold text-foreground mb-2">
            Betrag (€)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />

          {/* Description Input */}
          <Text className="text-sm font-semibold text-foreground mb-2">
            Beschreibung
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Was hast du gekauft?"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />

          {/* Buttons */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={handleAddExpense}
              className="flex-1 bg-primary rounded-lg py-3"
            >
              <Text className="text-white text-center font-semibold">
                Ausgabe hinzufügen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              className="px-6 bg-border rounded-lg py-3"
            >
              <Text className="text-foreground text-center font-semibold">
                Abbrechen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="bg-primary rounded-xl py-4 shadow-lg"
        >
          <Text className="text-white text-center text-lg font-bold">
            + Ausgabe hinzufügen
          </Text>
        </TouchableOpacity>
      )}

      {/* Letzte Ausgaben List */}
      <Text className="text-lg font-bold text-foreground mt-6 mb-3">
        Letzte Ausgaben
      </Text>
      <ScrollView>
        {expenses.slice(0, 10).map((expense) => (
          <View
            key={expense.id}
            className="bg-surface border border-border rounded-xl p-4 mb-2"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-semibold text-foreground capitalize">
                {expense.category}
              </Text>
              <Text className="text-lg font-bold text-primary">
                {expense.amount.toFixed(2)} €
              </Text>
            </View>
            <Text className="text-sm text-muted">{expense.description}</Text>
            <Text className="text-xs text-muted mt-1">
              {expense.date.toLocaleDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
