import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ DATOS REALES DE TU PROYECTO SUPABASE
const SUPABASE_URL = "https://ucudulysbldpoqmqcanz.supabase.co";
const SUPABASE_KEY = "sb_publishable_J74RgJlliGv3pMgHio_ReA_zYSePAcf";

// 🔗 Cliente Supabase
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
