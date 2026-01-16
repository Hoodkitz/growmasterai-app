/**
 * Cost Tracking & ROI Calculator
 * Track expenses and calculate profitability
 */

export interface Expense {
  id: string;
  plantId?: string; // Optional: for plant-specific expenses
  category: 'seeds' | 'nutrients' | 'lights' | 'equipment' | 'electricity' | 'water' | 'other';
  description: string;
  amount: number;
  currency: string;
  date: Date;
  receiptPhoto?: string;
  recurring?: boolean; // Monthly expenses like electricity
}

export interface CostSummary {
  totalSpent: number;
  byCategory: Record<string, number>;
  perPlant?: Record<string, number>;
  projectedYield?: number;
  costPerGram?: number;
  roi?: number;
}

/**
 * Calculate total expenses
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate expenses by category
 */
export function calculateByCategory(expenses: Expense[]): Record<string, number> {
  const byCategory: Record<string, number> = {};

  expenses.forEach(expense => {
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = 0;
    }
    byCategory[expense.category] += expense.amount;
  });

  return byCategory;
}

/**
 * Calculate expenses per plant
 */
export function calculatePerPlant(
  expenses: Expense[],
  plantId: string
): number {
  return expenses
    .filter(e => e.plantId === plantId || !e.plantId) // Include shared expenses
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate cost per gram
 */
export function calculateCostPerGram(
  totalExpenses: number,
  actualYield: number // in grams
): number {
  if (actualYield <= 0) return 0;
  return totalExpenses / actualYield;
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(
  totalExpenses: number,
  yieldGrams: number,
  pricePerGram: number = 10 // Default $10/gram
): number {
  const revenue = yieldGrams * pricePerGram;
  const profit = revenue - totalExpenses;
  const roi = (profit / totalExpenses) * 100;
  return Math.round(roi);
}

/**
 * Estimate electricity cost
 */
export function estimateElectricityCost(
  lightWattage: number,
  hoursPerDay: number,
  daysOfGrow: number,
  costPerKwh: number = 0.13 // Average US rate
): number {
  const totalKwh = (lightWattage * hoursPerDay * daysOfGrow) / 1000;
  return totalKwh * costPerKwh;
}

/**
 * Get monthly recurring expenses
 */
export function getMonthlyRecurringExpenses(expenses: Expense[]): number {
  return expenses
    .filter(e => e.recurring)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Expense breakdown for visualization
 */
export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function getExpenseBreakdown(expenses: Expense[]): ExpenseBreakdown[] {
  const byCategory = calculateByCategory(expenses);
  const total = calculateTotalExpenses(expenses);

  const colors: Record<string, string> = {
    seeds: '#10B981',
    nutrients: '#3B82F6',
    lights: '#F59E0B',
    equipment: '#8B5CF6',
    electricity: '#EF4444',
    water: '#06B6D4',
    other: '#6B7280',
  };

  return Object.entries(byCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: Math.round((amount / total) * 100),
    color: colors[category] || colors.other,
  }));
}

/**
 * Profit calculation with market value
 */
export interface ProfitAnalysis {
  totalCost: number;
  yieldGrams: number;
  marketValue: number;
  profit: number;
  roi: number;
  breakEvenGrams: number;
  costPerGram: number;
}

export function analyzeProfitability(
  expenses: Expense[],
  yieldGrams: number,
  marketPricePerGram: number = 10
): ProfitAnalysis {
  const totalCost = calculateTotalExpenses(expenses);
  const marketValue = yieldGrams * marketPricePerGram;
  const profit = marketValue - totalCost;
  const roi = calculateROI(totalCost, yieldGrams, marketPricePerGram);
  const breakEvenGrams = totalCost / marketPricePerGram;
  const costPerGram = calculateCostPerGram(totalCost, yieldGrams);

  return {
    totalCost,
    yieldGrams,
    marketValue,
    profit,
    roi,
    breakEvenGrams,
    costPerGram,
  };
}
