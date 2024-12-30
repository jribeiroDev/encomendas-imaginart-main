//import { createClient } from '@supabase/supabase-js';

//const supabaseUrl = 'https://fzylihxwrdmiluhnbaey.supabase.co';
//const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWxpaHh3cmRtaWx1aG5iYWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTUzMDI1OCwiZXhwIjoyMDUxMTA2MjU4fQ.kipJ4YbXhbR1GpnF88gUG8MdMjmzkMFvhKC3MGHDWNs'
//export const supabase = createClient(supabaseUrl, supabaseKey);

import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
