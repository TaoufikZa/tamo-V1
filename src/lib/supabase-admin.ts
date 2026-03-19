import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client strictly for server-side use only. Bypasses RLS.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
