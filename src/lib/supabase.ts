import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfbnlouycrkyfrobrpcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYm5sb3V5Y3JreWZyb2JycGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MjM1MzUsImV4cCI6MjA1MTA5OTUzNX0.WGunSOtrXJjBZx-XOZNho0h9H6ZaQFcQU4_qC83wFzU';

export const supabase = createClient(supabaseUrl, supabaseKey);