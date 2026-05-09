REVOKE EXECUTE ON FUNCTION public.claim_job_offer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_job_offer(UUID) TO authenticated;