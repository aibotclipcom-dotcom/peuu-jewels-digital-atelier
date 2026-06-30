ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;
CREATE INDEX IF NOT EXISTS orders_razorpay_order_id_idx ON public.orders(razorpay_order_id);