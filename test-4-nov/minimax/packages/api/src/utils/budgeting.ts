import type { BudgetAllocation, BudgetCategory } from '@minimax/db/src/schema/budget';

export interface BudgetSummary {
  categoryId: string;
  categoryName: string;
  allocated: number;
  spent: number;
  remaining: number;
  progress: number;
}

export interface MonthlyBudgetSummary {
  month: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetSummary[];
}

export function calculateBudgetProgress(
  allocated: string | number,
  spent: string | number
): number {
  const alloc = typeof allocated === 'string' ? parseFloat(allocated) : allocated;
  const spentAmount = typeof spent === 'string' ? parseFloat(spent) : spent;

  if (alloc === 0) return 0;
  return Math.min((spentAmount / alloc) * 100, 100);
}

export function calculateBudgetSummary(
  allocations: BudgetAllocation[],
  categories: BudgetCategory[]
): BudgetSummary[] {
  return allocations.map(allocation => {
    const category = categories.find(c => c.id === allocation.categoryId);
    const allocated = parseFloat(allocation.allocated);
    const spent = parseFloat(allocation.spent);
    const remaining = allocated - spent;
    const progress = calculateBudgetProgress(allocated, spent);

    return {
      categoryId: allocation.categoryId,
      categoryName: category?.name || 'Unknown Category',
      allocated,
      spent,
      remaining,
      progress,
    };
  });
}

export function calculateMonthlySummary(
  allocations: BudgetAllocation[],
  categories: BudgetCategory[],
  month: string
): MonthlyBudgetSummary {
  const monthAllocations = allocations.filter(a => a.month.startsWith(month));
  const summaries = calculateBudgetSummary(monthAllocations, categories);

  const totalAllocated = summaries.reduce((sum, s) => sum + s.allocated, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;

  return {
    month,
    totalAllocated,
    totalSpent,
    totalRemaining,
    categories: summaries,
  };
}

export function getBudgetWarnings(summaries: BudgetSummary[]): string[] {
  const warnings: string[] = [];

  summaries.forEach(summary => {
    if (summary.progress >= 90 && summary.progress < 100) {
      warnings.push(
        `Budget almost exceeded for ${summary.categoryName} (${summary.progress.toFixed(1)}%)`
      );
    } else if (summary.progress >= 100) {
      warnings.push(
        `Budget exceeded for ${summary.categoryName} by $${summary.remaining.toFixed(2)}`
      );
    }
  });

  return warnings;
}

export function calculateNetIncome(
  income: number,
  expenses: number
): { net: number; percentage: number } {
  const net = income - expenses;
  const percentage = income === 0 ? 0 : Math.abs((net / income) * 100);

  return { net, percentage };
}

export function suggestBudgetAdjustments(
  summaries: BudgetSummary[],
  availableAmount: number
): { categoryId: string; suggestedAmount: number }[] {
  const overspentCategories = summaries.filter(s => s.spent > s.allocated);
  const suggestions: { categoryId: string; suggestedAmount: number }[] = [];

  overspentCategories.forEach(summary => {
    const overspend = summary.spent - summary.allocated;
    const adjustment = overspend + (overspend * 0.1);
    suggestions.push({
      categoryId: summary.categoryId,
      suggestedAmount: adjustment,
    });
  });

  return suggestions;
}
