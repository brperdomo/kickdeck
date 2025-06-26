-- Add missing columns to payment_transactions table
-- This fixes the schema mismatch that prevents Connect payment processing

ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS stripe_fee integer,
ADD COLUMN IF NOT EXISTS net_amount integer,
ADD COLUMN IF NOT EXISTS settlement_date timestamp,
ADD COLUMN IF NOT EXISTS payout_id text;

-- Verify the new columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
  AND column_name IN ('stripe_fee', 'net_amount', 'settlement_date', 'payout_id')
ORDER BY column_name;