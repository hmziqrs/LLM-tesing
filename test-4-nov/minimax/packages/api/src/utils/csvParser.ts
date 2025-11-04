export interface CsvTransaction {
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category?: string;
}

export function parseCsvTransactions(csvContent: string): CsvTransaction[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  const transactions: CsvTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const transaction: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      switch (header) {
        case 'date':
          transaction.date = value;
          break;
        case 'description':
          transaction.description = value;
          break;
        case 'amount':
          transaction.amount = value;
          break;
        case 'type':
          transaction.type = value.toLowerCase() as 'income' | 'expense';
          break;
        case 'category':
          transaction.category = value;
          break;
      }
    });

    if (transaction.date && transaction.description && transaction.amount) {
      transactions.push(transaction as CsvTransaction);
    }
  }

  return transactions;
}

export function validateCsvFormat(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    errors.push('CSV must have a header row and at least one data row');
    return { valid: false, errors };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['date', 'description', 'amount', 'type'];

  requiredHeaders.forEach(header => {
    if (!headers.includes(header)) {
      errors.push(`Missing required column: ${header}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
