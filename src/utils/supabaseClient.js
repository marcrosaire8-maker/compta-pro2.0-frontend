import { createClient } from '@supabase/supabase-js';

// Vos clés API sont maintenant intégrées
const SUPABASE_URL = 'https://iekpwdnqalzuqsgcgejy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla3B3ZG5xYWx6dXFzZ2NnZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODczMzEsImV4cCI6MjA3ODk2MzMzMX0.9_xoisbtCxIprUncv9dP0ZHfKqAdXc9Ws_clmnLNtBI';

// Crée le client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
