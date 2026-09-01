
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://rwqwczwapgbicigvumdb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cWN3endhcGdiaWNpZ3Z1bWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc0MzQ5OSwiZXhwIjoyMTAzMzE5NDk5fQ.AAzxrMi0paI-5iOpUWd3QP06pvi6cegwnLktaNF8rUQ'
);
async function run() {
  const { data, error } = await supabase.auth.admin.listUsers();
  console.log('Auth Users:', data.users.length);
  if (data.users.length > 0) {
    console.log('First User ID:', data.users[0].id);
  }
}
run();
