// supabaseClient.js
// Central Supabase configuration and client initialization

const SUPABASE_URL = 'https://onktkbnsvrjotxfdqpai.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua3RrYm5zdnJqb3R4ZmRxcGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTQyMjQsImV4cCI6MjA3ODc3MDIyNH0.-5k7sgBW42BaY1-7aep6P1BeWZT6XBXq5GbCrK8bWek';
const TABLE_NAME = 'numbers';
const ALL_NUMBERS_TABLE = 'all_numbers';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY, TABLE_NAME, ALL_NUMBERS_TABLE };
}