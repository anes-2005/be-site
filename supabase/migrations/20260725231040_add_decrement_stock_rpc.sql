/*
# Add decrement_stock RPC

1. Purpose
   Atomically decrement a collection's remaining_stock when a preorder is
   submitted. Prevents overselling by clamping at 0 and returning the new
   value. Called from the preorder form after a successful insert.

2. New Functions
   - `decrement_stock(row_id uuid, amount int)` -> integer
     Decrements remaining_stock by `amount` (default 1), never below 0.
     Returns the new remaining_stock, or -1 if the row was not found.

3. Security
   - SECURITY DEFINER so it can run with elevated privileges for the update.
   - Granted to anon + authenticated (single-tenant CMS, no public sign-in).

4. Notes
   - Idempotent via CREATE OR REPLACE.
*/

CREATE OR REPLACE FUNCTION decrement_stock(row_id uuid, amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_value integer;
BEGIN
  UPDATE collections
    SET remaining_stock = GREATEST(0, remaining_stock - GREATEST(1, amount)),
        updated_at = now()
    WHERE id = row_id
    RETURNING remaining_stock INTO new_value;

  IF new_value IS NULL THEN
    RETURN -1;
  END IF;

  -- If stock hit 0, mark sold out automatically.
  IF new_value = 0 THEN
    UPDATE collections SET availability_status = 'sold_out', preorder_enabled = false
      WHERE id = row_id;
  END IF;

  RETURN new_value;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_stock(uuid, integer) TO anon, authenticated;
