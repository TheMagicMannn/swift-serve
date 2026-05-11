-- Add new job status values
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'disputed';

-- Extend jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Disputes
CREATE TYPE dispute_status AS ENUM ('open', 'resolved', 'refunded', 'rejected');

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_job ON public.disputes(job_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view own disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = disputes.job_id
            AND (auth.uid() = j.customer_id OR auth.uid() = j.provider_id))
  );

CREATE POLICY "Participants open disputes" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = opened_by AND
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = disputes.job_id
            AND (auth.uid() = j.customer_id OR auth.uid() = j.provider_id))
  );

CREATE POLICY "Admins manage disputes" ON public.disputes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_target ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = actor_id);

-- Admin action RPCs
CREATE OR REPLACE FUNCTION public.admin_update_job_status(_job_id UUID, _status job_status, _note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _old job_status;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT status INTO _old FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF _old IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;

  UPDATE public.jobs SET status = _status, updated_at = now() WHERE id = _job_id;

  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'job.status_change', 'job', _job_id,
          jsonb_build_object('from', _old, 'to', _status, 'note', _note));
END $$;

CREATE OR REPLACE FUNCTION public.admin_cancel_job(_job_id UUID, _reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.jobs SET status = 'cancelled', cancelled_reason = _reason, updated_at = now()
    WHERE id = _job_id;
  UPDATE public.job_offers SET status = 'cancelled', responded_at = now()
    WHERE job_id = _job_id AND status = 'pending';
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'job.cancel', 'job', _job_id, jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.admin_refund_job(_job_id UUID, _amount_cents INTEGER, _note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.jobs
    SET status = 'refunded', refunded_cents = _amount_cents, refunded_at = now(), updated_at = now()
    WHERE id = _job_id;
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'job.refund', 'job', _job_id,
          jsonb_build_object('amount_cents', _amount_cents, 'note', _note));
END $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_dispute(_dispute_id UUID, _status dispute_status, _notes TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _job UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _status = 'open' THEN RAISE EXCEPTION 'Cannot resolve to open'; END IF;

  UPDATE public.disputes
    SET status = _status, resolution_notes = _notes, resolved_by = auth.uid(), resolved_at = now()
    WHERE id = _dispute_id
    RETURNING job_id INTO _job;

  IF _job IS NULL THEN RAISE EXCEPTION 'Dispute not found'; END IF;

  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'dispute.resolve', 'dispute', _dispute_id,
          jsonb_build_object('status', _status, 'notes', _notes, 'job_id', _job));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_update_job_status(UUID, job_status, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_job(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_refund_job(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_dispute(UUID, dispute_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_job_status(UUID, job_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_job(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_refund_job(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_dispute(UUID, dispute_status, TEXT) TO authenticated;