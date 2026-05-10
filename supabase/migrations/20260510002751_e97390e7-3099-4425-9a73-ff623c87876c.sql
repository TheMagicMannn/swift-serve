
-- Messages table for in-job chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_job ON public.messages(job_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = messages.job_id
      AND (auth.uid() = j.customer_id OR auth.uid() = j.provider_id OR has_role(auth.uid(),'admin'))
  )
);

CREATE POLICY "Participants send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = messages.job_id
      AND (auth.uid() = j.customer_id OR auth.uid() = j.provider_id)
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Job completions: proof photos + rating
CREATE TABLE public.job_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE,
  provider_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  proof_paths TEXT[] NOT NULL DEFAULT '{}',
  provider_notes TEXT,
  customer_confirmed_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view completion"
ON public.job_completions FOR SELECT TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = customer_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "Provider inserts own completion"
ON public.job_completions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Participants update completion"
ON public.job_completions FOR UPDATE TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = customer_id);

CREATE TRIGGER tg_job_completions_updated
BEFORE UPDATE ON public.job_completions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update provider rating aggregate when customer rates
CREATE OR REPLACE FUNCTION public.apply_provider_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _avg NUMERIC;
  _cnt INTEGER;
BEGIN
  IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL OR OLD.rating <> NEW.rating) THEN
    SELECT AVG(rating)::numeric(3,2), COUNT(*) INTO _avg, _cnt
    FROM public.job_completions WHERE provider_id = NEW.provider_id AND rating IS NOT NULL;
    UPDATE public.provider_profiles
      SET rating = COALESCE(_avg, 5.0),
          completed_count = (SELECT COUNT(*) FROM public.jobs WHERE provider_id = NEW.provider_id AND status = 'completed')
      WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_apply_rating
AFTER INSERT OR UPDATE OF rating ON public.job_completions
FOR EACH ROW EXECUTE FUNCTION public.apply_provider_rating();
