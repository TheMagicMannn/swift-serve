
CREATE TABLE IF NOT EXISTS public.provider_locations (
  provider_id UUID PRIMARY KEY,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  accuracy NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers upsert own location"
  ON public.provider_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers update own location"
  ON public.provider_locations FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Provider self read"
  ON public.provider_locations FOR SELECT TO authenticated
  USING (
    auth.uid() = provider_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.provider_id = provider_locations.provider_id
        AND j.customer_id = auth.uid()
        AND j.status IN ('assigned','en_route','arrived','in_progress')
    )
  );

ALTER TABLE public.provider_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_locations;
