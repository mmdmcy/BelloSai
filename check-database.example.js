// Script om de database schema te controleren
// Kopieer dit naar check-database.js en vul je eigen credentials in
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

async function checkDatabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your_supabase')) {
    console.error('❌ Please set your Supabase credentials in environment variables or update this file');
    return;
  }

  try {
    // Check if users table exists
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Users table check:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Users table exists');
      const data = await response.json();
      console.log('Sample data:', data);
    } else if (response.status === 404) {
      console.log('❌ Users table does not exist');
    } else {
      console.log('❓ Unexpected response:', await response.text());
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase(); 