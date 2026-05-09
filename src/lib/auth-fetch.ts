import { supabase } from "@/integrations/supabase/client";

// Patch global fetch on the client so server-fn requests include the
// current Supabase access token. Server-side requireSupabaseAuth requires
// a Bearer token on /_serverFn/* calls.
let installed = false;
export function installAuthFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url && url.includes("/_serverFn/")) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
          if (!headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
          return orig(input, { ...init, headers });
        }
      }
    } catch {
      // fall through
    }
    return orig(input, init);
  };
}
