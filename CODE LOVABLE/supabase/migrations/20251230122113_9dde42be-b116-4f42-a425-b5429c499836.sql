-- Create table for institution webhooks
CREATE TABLE public.institution_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (admin-only configuration)
ALTER TABLE public.institution_webhooks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read webhooks (needed for all users to see configured URLs)
CREATE POLICY "Anyone can view webhooks" 
ON public.institution_webhooks 
FOR SELECT 
USING (true);

-- Allow anyone to insert webhooks (admin configuration)
CREATE POLICY "Anyone can insert webhooks" 
ON public.institution_webhooks 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update webhooks
CREATE POLICY "Anyone can update webhooks" 
ON public.institution_webhooks 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_institution_webhooks_updated_at
BEFORE UPDATE ON public.institution_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();