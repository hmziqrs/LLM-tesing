-- Initialize database for production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_account_user_id ON "financial_account"(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "transaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON "transaction"(date);
CREATE INDEX IF NOT EXISTS idx_budget_category_user_id ON "budget_category"(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_user_id ON "goal"(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bill_user_id ON "recurring_bill"(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bill_next_due ON "recurring_bill"(next_due);

-- Set timezone for consistent date handling
SET timezone = 'UTC';