import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzylihxwrdmiluhnbaey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWxpaHh3cmRtaWx1aG5iYWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MzAyNTgsImV4cCI6MjA1MTEwNjI1OH0.gO87oWY3B0FeYStlnVXYvlMqvI6qnVlFtbc6hCtOBWg'
export const supabase = createClient(supabaseUrl, supabaseKey);
