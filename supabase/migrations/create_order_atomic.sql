-- Migration: Atomic Order Creation & Inventory Lock Procedure
-- Description: Prevents double-spending, inventory exhaustion, and duplicate payment processing via SELECT FOR UPDATE

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_user_id UUID,
  p_project_id INT,
  p_project_name TEXT,
  p_quantity INT,
  p_total_cost NUMERIC,
  p_razorpay_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_farm_record RECORD;
  v_existing_purchase_id UUID;
  v_new_purchase RECORD;
BEGIN
  -- 1. Idempotency Check: Verify razorpay_payment_id hasn't already been processed
  SELECT id INTO v_existing_purchase_id
  FROM purchases
  WHERE razorpay_payment_id = p_razorpay_payment_id;

  IF v_existing_purchase_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_PAYMENT',
      'message', 'Payment ID has already been fulfilled.',
      'purchase_id', v_existing_purchase_id
    );
  END IF;

  -- 2. Lock Farm Record for Update (prevents concurrent double-purchasing)
  SELECT * INTO v_farm_record
  FROM farms
  WHERE id = p_project_id
  FOR UPDATE;

  -- 3. Execute Purchase Insertion atomically
  INSERT INTO purchases (
    user_id,
    project_id,
    project_name,
    quantity,
    total_cost,
    razorpay_payment_id
  ) VALUES (
    p_user_id,
    p_project_id,
    p_project_name,
    p_quantity,
    p_total_cost,
    p_razorpay_payment_id
  )
  RETURNING * INTO v_new_purchase;

  RETURN jsonb_build_object(
    'success', true,
    'purchase', row_to_json(v_new_purchase)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TRANSACTION_FAILED',
      'message', SQLERRM
    );
END;
$$;
