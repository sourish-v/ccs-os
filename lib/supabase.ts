import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://houlznhofywzduvetxfz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BKZdxxuCi0nlCEQd7GzMFA_yhgdNJK9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
