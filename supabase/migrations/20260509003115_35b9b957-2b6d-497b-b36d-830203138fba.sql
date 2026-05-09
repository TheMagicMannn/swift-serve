
-- provider_profiles
CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  service_radius_km NUMERIC NOT NULL DEFAULT 10,
  vehicle TEXT,
  payout_method TEXT,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  completed_count INT NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  base_lat NUMERIC,
  base_lng NUMERIC,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider profiles viewable by authenticated"
  ON public.provider_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Providers insert own provider profile"
  ON public.provider_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Providers update own provider profile"
  ON public.provider_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER trg_provider_profiles_updated
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- job_offers
CREATE TYPE public.offer_status AS ENUM ('pending','accepted','declined','expired','cancelled');

CREATE TABLE public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  status offer_status NOT NULL DEFAULT 'pending',
  match_score NUMERIC NOT NULL DEFAULT 0,
  eta_minutes INT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 minutes'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, provider_id)
);

CREATE INDEX idx_job_offers_provider_status ON public.job_offers(provider_id, status);
CREATE INDEX idx_job_offers_job ON public.job_offers(job_id);

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers see own offers"
  ON public.job_offers FOR SELECT TO authenticated
  USING (auth.uid() = provider_id OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.customer_id = auth.uid()));

CREATE POLICY "Providers update own offers"
  ON public.job_offers FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins manage offers"
  ON public.job_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_job_offers_updated
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Claim function: first accept wins, atomic
CREATE OR REPLACE FUNCTION public.claim_job_offer(_offer_id UUID)
RETURNS TABLE(job_id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job_id UUID;
  _provider UUID;
  _job_status job_status;
BEGIN
  SELECT o.job_id, o.provider_id INTO _job_id, _provider
  FROM public.job_offers o
  WHERE o.id = _offer_id AND o.provider_id = auth.uid() AND o.status = 'pending'
  FOR UPDATE;

  IF _job_id IS NULL THEN
    RAISE EXCEPTION 'Offer not available';
  END IF;

  SELECT j.status INTO _job_status FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
  IF _job_status <> 'dispatching' THEN
    UPDATE public.job_offers SET status='cancelled', responded_at=now() WHERE id=_offer_id;
    RAISE EXCEPTION 'Job no longer available';
  END IF;

  UPDATE public.jobs
    SET provider_id = _provider, status = 'assigned', updated_at = now()
    WHERE id = _job_id;

  UPDATE public.job_offers SET status='accepted', responded_at=now() WHERE id=_offer_id;
  UPDATE public.job_offers SET status='cancelled', responded_at=now()
    WHERE job_id = _job_id AND id <> _offer_id AND status='pending';

  RETURN QUERY SELECT _job_id, 'assigned'::TEXT;
END;
$$;

-- Realtime
ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER TABLE public.job_offers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_offers;
