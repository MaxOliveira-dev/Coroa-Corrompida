import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cmsbtaysjyebgmfwthwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtc2J0YXlzanllYmdtZnd0aHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDYxODEsImV4cCI6MjA2NzQ4MjE4MX0.SWOPqnjk5v71b3fgZBev7gfB3R11_q0MDsfG1uMhwFw';

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key must be defined.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);