-- Job status enum
CREATE TYPE public.job_status AS ENUM (
  'draft','scoping','dispatching','assigned','en_route','arrived','in_progress','completed','cancelled'
);

CREATE TYPE public.job_urgency AS ENUM ('standard','urgent','emergency');

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  provider_id uuid,
  status public.job_status NOT NULL DEFAULT 'draft',
  urgency public.job_urgency NOT NULL DEFAULT 'standard',
  description text NOT NULL,
  address text NOT NULL,
  media_paths text[] NOT NULL DEFAULT '{}',
  -- AI scope output
  scope_title text,
  scope_category text,
  scope_tasks text[],
  scope_duration_minutes int,
  scope_skill text,
  scope_risk text,
  scope_confidence numeric,
  scope_notes text,
  price_cents int,
  labor_cents int,
  platform_cents int,
  materials_cents int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX idx_jobs_provider ON public.jobs(provider_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own jobs"
ON public.jobs FOR SELECT TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Customers insert own jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers update own jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Customers delete own draft jobs"
ON public.jobs FOR DELETE TO authenticated
USING (auth.uid() = customer_id AND status = 'draft');

CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for job-media bucket (private, per-user folder)
CREATE POLICY "Users can view own job media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'job-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own job media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own job media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'job-media' AND auth.uid()::text = (storage.foldername(name))[1]);
