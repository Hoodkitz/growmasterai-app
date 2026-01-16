/**
 * Expense Tracker Component
 * Track and visualize grow expenses
 */

import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { Expense, calculateTotalExpenses, getExpenseBreakdown, analyzeProfitability } from '@/lib/cost-tracking';

interface ExpenseTrackerProps {
  plantId?: string;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  yieldGrams?: number;
}

export function ExpenseTracker({ plantId, expenses, onAddExpense, yieldGrams }: ExpenseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Expense['category']>('nutrients');

  const total = calculateTotalExpenses(expenses);
  const breakdown = getExpenseBreakdown(expenses);
  const profitAnalysis = yieldGrams ? analyzeProfitability(expenses, yieldGrams) : null;

  const categories: Array<{ key: Expense['category']; label: string; icon: string }> = [
    { key: 'seeds', label: 'Seeds', icon: '🌱' },
    { key: 'nutrients', label: 'Nutrients', icon: '🌿' },
    { key: 'lights', label: 'Lights', icon: '💡' },
    { key: 'equipment', label: 'Equipment', icon: '🔧' },
    { key: 'electricity', label: 'Electricity', icon: '⚡' },
    { key: 'water', label: 'Water', icon: '💧' },
    { key: 'other', label: 'Other', icon: '📦' },
  ];

  const handleAddExpense = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !description.trim()) {
      alert('Please enter valid amount and description');
      return;
    }

    onAddExpense({
      plantId,
      category,
      description,
      amount: parsedAmount,
      currency: 'USD',
      date: new Date(),
    });

    // Reset form
    setAmount('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <View className="flex-1">
      {/* Summary Cards */}
      <View className="flex-row mb-4">
        <View className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-4 mr-2">
          <Text className="text-sm text-muted mb-1">Total Spent</Text>
          <Text className="text-2xl font-bold text-primary">${total.toFixed(2)}</Text>
        </View>
        
        {profitAnalysis && (
          <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <Text className="text-sm text-muted mb-1">Cost/Gram</Text>
            <Text className="text-2xl font-bold text-green-600">
              ${profitAnalysis.costPerGram.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* ROI Card */}
      {profitAnalysis && (
        <View className={`p-4 rounded-xl mb-4 ${profitAnalysis.roi > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <Text className="text-lg font-bold mb-2">
            ROI: {profitAnalysis.roi > 0 ? '+' : ''}{profitAnalysis.roi}%
          </Text>
          <Text className="text-sm text-muted">
            Market Value: ${profitAnalysis.marketValue.toFixed(2)} • 
            Profit: ${profitAnalysis.profit.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Category Breakdown */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">Expense Breakdown</Text>
        {breakdown.map((item) => (
          <View key={item.category} className="flex-row items-center mb-3">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-base text-foreground capitalize flex-1">
                  {item.category}
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View 
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color 
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

      {/* Add Expense Button/Form */}
      {showAddForm ? (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">Add Expense</Text>
          
          {/* Category Selection */}
          <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                className={`mr-2 px-4 py-2 rounded-lg ${category === cat.key ? 'bg-primary' : 'bg-border'}`}
              >
                <Text className={category === cat.key ? 'text-white' : 'text-foreground'}>
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount Input */}
          <Text className="text-sm font-semibold text-foreground mb-2">Amount ($)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />

          {/* Description Input */}
          <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What did you buy?"
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />

          {/* Buttons */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={handleAddExpense}
              className="flex-1 bg-primary rounded-lg py-3"
            >
              <Text className="text-white text-center font-semibold">Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              className="px-6 bg-border rounded-lg py-3"
            >
              <Text className="text-foreground text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="bg-primary rounded-xl py-4 shadow-lg"
        >
          <Text className="text-white text-center text-lg font-bold">
            + Add Expense
          </Text>
        </TouchableOpacity>
      )}

      {/* Recent Expenses List */}
      <Text className="text-lg font-bold text-foreground mt-6 mb-3">Recent Expenses</Text>
      <ScrollView>
        {expenses.slice(0, 10).map((expense) => (
          <View key={expense.id} className="bg-surface border border-border rounded-xl p-4 mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-semibold text-foreground capitalize">
                {expense.category}
              </Text>
              <Text className="text-lg font-bold text-primary">
                ${expense.amount.toFixed(2)}
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
