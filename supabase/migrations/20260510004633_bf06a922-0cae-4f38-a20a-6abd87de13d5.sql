-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  job_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts notifications for participants"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = notifications.job_id
        AND (auth.uid() = j.customer_id OR auth.uid() = j.provider_id)
        AND (notifications.user_id = j.customer_id OR notifications.user_id = j.provider_id)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Notify customer when job status changes
CREATE OR REPLACE FUNCTION public.notify_job_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, title, body, kind, job_id)
    VALUES (NEW.customer_id, 'Job update', 'Status: ' || NEW.status::text, 'job', NEW.id);
    IF NEW.provider_id IS NOT NULL AND NEW.status IN ('assigned','en_route','arrived','in_progress','completed') THEN
      INSERT INTO public.notifications(user_id, title, body, kind, job_id)
      VALUES (NEW.provider_id, 'Job update', 'Status: ' || NEW.status::text, 'job', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_job_status
AFTER UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_job_status_change();

-- Notify provider when new offer arrives
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, title, body, kind, job_id)
  VALUES (NEW.provider_id, 'New job offer', 'You have a new offer', 'offer', NEW.job_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_new_offer
AFTER INSERT ON public.job_offers
FOR EACH ROW EXECUTE FUNCTION public.notify_new_offer();

-- Notify on new chat message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cust UUID; _prov UUID; _recipient UUID;
BEGIN
  SELECT customer_id, provider_id INTO _cust, _prov FROM public.jobs WHERE id = NEW.job_id;
  _recipient := CASE WHEN NEW.sender_id = _cust THEN _prov ELSE _cust END;
  IF _recipient IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, body, kind, job_id)
    VALUES (_recipient, 'New message', LEFT(NEW.body, 80), 'chat', NEW.job_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Admin overview helper
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT json_build_object(
    'users', (SELECT COUNT(*) FROM public.profiles),
    'providers', (SELECT COUNT(*) FROM public.provider_profiles),
    'online_providers', (SELECT COUNT(*) FROM public.provider_profiles WHERE is_online),
    'jobs_total', (SELECT COUNT(*) FROM public.jobs),
    'jobs_active', (SELECT COUNT(*) FROM public.jobs WHERE status IN ('dispatching','assigned','en_route','arrived','in_progress')),
    'jobs_completed', (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed'),
    'gmv_cents', (SELECT COALESCE(SUM(price_cents),0) FROM public.jobs WHERE status='completed')
  ) INTO _r;
  RETURN _r;
END $$;