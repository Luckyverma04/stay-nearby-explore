-- Create invoices table for storing generated invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'generated',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  invoice_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create refunds table for tracking refund requests
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  payment_log_id UUID,
  user_id UUID NOT NULL,
  refund_amount NUMERIC NOT NULL,
  refund_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  refund_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_payment_methods table for storing saved payment methods
CREATE TABLE public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payment_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  masked_details JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_analytics table for detailed analytics
CREATE TABLE public.payment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  successful_payments INTEGER NOT NULL DEFAULT 0,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  refunded_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_methods JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON public.invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all invoices" ON public.invoices
FOR ALL USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "System can insert invoices" ON public.invoices
FOR INSERT WITH CHECK (true);

-- Refunds policies
CREATE POLICY "Users can create refund requests" ON public.refunds
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own refunds" ON public.refunds
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all refunds" ON public.refunds
FOR ALL USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON public.user_payment_methods
FOR ALL USING (auth.uid() = user_id);

-- Payment analytics policies
CREATE POLICY "Admins can view payment analytics" ON public.payment_analytics
FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "System can insert payment analytics" ON public.payment_analytics
FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_refunds_user_id ON public.refunds(user_id);
CREATE INDEX idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX idx_payment_analytics_date ON public.payment_analytics(date);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_num TEXT;
BEGIN
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0')
  INTO invoice_num;
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Create trigger to automatically update updated_at timestamps
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON public.user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();