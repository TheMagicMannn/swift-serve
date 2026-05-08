## Tasker — Production Backend Plan

Goal: take the current visual prototype to a real, deployable product. We'll do this across multiple turns. Each phase ends in a working, testable slice.

---

### Phase 1 — Foundation (this turn)
- Enable **Lovable Cloud** (database, auth, storage, server functions).
- **Auth**: Email + Password, Google, Apple sign-in. Login/signup screens wired to real auth, session persistence, route guards (`_authenticated` layout), logout.
- **Profiles**: `profiles` table (name, avatar, phone, default address) + auto-create trigger on signup. Separate `user_roles` table (`customer`, `provider`, `admin`) using the secure `has_role` pattern. Role switcher persists real role.
- **Storage bucket** `job-media` for photos/videos with RLS.
- Profile page reads/writes real data. Sign-out works.

### Phase 2 — Jobs + AI scoping
- `jobs` table (status, scope, price, address, urgency, customer_id, provider_id, media[]).
- Create-job flow uploads media to storage, then calls a server function that uses **Lovable AI Gateway** (Gemini vision) to produce structured scope: title, category, included tasks, duration, skill, risk, fixed price, confidence.
- `/scope` shows real AI output. Confirm → inserts a real job row.
- `/jobs` lists the customer's real jobs from DB.

### Phase 3 — Dispatch + Provider app
- `provider_profiles` (skills, service_radius, vehicle, payout_method placeholder, rating, completed_count).
- `job_offers` table; server fn ranks providers by skill match + distance + rating, fans out offers.
- Provider dashboard shows real live offers (Supabase realtime). Accept/decline with row-level locking so first accept wins.
- Customer `/dispatch` and `/track` reflect real status via realtime subscriptions.

### Phase 4 — Chat + tracking + completion
- `messages` table per job with RLS (only customer + assigned provider).
- Realtime chat on `/chat`.
- Status timeline: en_route → arrived → in_progress → completed, driven by provider actions.
- Proof of completion: photo upload + customer confirmation + rating.

### Phase 5 — Admin, polish, store-readiness
- Admin role views: jobs queue, disputes, user management (role-gated).
- Push-style in-app notifications table + toasts.
- PWA manifest + icons + service worker so it installs to home screen.
- Capacitor wrapper config (iOS + Android) so it can be packaged for App Store / Play Store.
- Final security scan, RLS audit, error boundaries, loading states.

### Payments
Deferred per your choice. Prices and payouts stay as display values until you're ready to wire Stripe.

---

### Technical notes
- All server logic via TanStack `createServerFn` (no Edge Functions).
- Roles in dedicated `user_roles` table + `has_role()` security-definer fn (never on profiles).
- All tables: RLS on, owner-scoped policies, admin override via `has_role`.
- AI calls server-side only, using `LOVABLE_API_KEY`.
- Media in private storage bucket, signed URLs for reads.

---

Reply **"go"** to start Phase 1 now. After each phase I'll report what's live and ask before starting the next.