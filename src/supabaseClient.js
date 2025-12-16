import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ctfbpavgdlqqesdoyhfb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0ZmJwYXZnZGxxcWVzZG95aGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODgzOTAsImV4cCI6MjA4MTA2NDM5MH0.o76Xr4pAhircqHSmC4oLtVkWxCc5WhfldrvWHM2JwtY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
