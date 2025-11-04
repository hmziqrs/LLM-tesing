import type { RecurringBill } from '@minimax/db/src/schema/recurring';

export interface GeneratedTransaction {
  billId: string;
  userId: string;
  accountId: string;
  amount: string;
  description: string;
  type: 'expense';
  date: string;
  categoryId?: string;
}

export function generateTransactionsFromRecurring(
  bill: RecurringBill,
  accountId: string,
  months: number = 6
): GeneratedTransaction[] {
  const transactions: GeneratedTransaction[] = [];
  const currentDate = new Date(bill.nextDueDate);

  for (let i = 0; i < months; i++) {
    const transactionDate = new Date(currentDate);

    transactions.push({
      billId: bill.id,
      userId: bill.userId,
      accountId,
      amount: bill.amount,
      description: bill.description || bill.name,
      type: 'expense',
      date: transactionDate.toISOString().split('T')[0],
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return transactions;
}

export function shouldGenerateTransaction(
  bill: RecurringBill,
  referenceDate: Date = new Date()
): boolean {
  const nextDueDate = new Date(bill.nextDueDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  nextDueDate.setHours(0, 0, 0, 0);

  return nextDueDate <= today;
}

export function calculateNextBillingCycle(bill: RecurringBill): string {
  const nextDueDate = new Date(bill.nextDueDate);

  switch (bill.frequency) {
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDueDate.setDate(nextDueDate.getDate() + 14);
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
  }

  return nextDueDate.toISOString().split('T')[0];
}

export function getUpcomingBills(bills: RecurringBill[], days: number = 30): RecurringBill[] {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return bills.filter(bill => {
    const dueDate = new Date(bill.nextDueDate);
    return dueDate >= today && dueDate <= futureDate;
  });
}
