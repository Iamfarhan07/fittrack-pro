
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://rwqcwzwapgbicigvumdb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cWN3endhcGdiaWNpZ3Z1bWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc0MzQ5OSwiZXhwIjoyMTAzMzE5NDk5fQ.AAzxrMi0paI-5iOpUWd3QP06pvi6cegwnLktaNF8rUQ'
);
async function run() {
  // We want to create exactly '00000000-0000-0000-0000-000000000000'
  // But auth.admin.createUser generates a random UUID.
  // We can insert directly into auth.users if we use raw SQL, but we can't do raw SQL via REST API.
  // Actually, in Supabase, we CANNOT insert a specific ID into auth.users via the REST API.
  // BUT wait, in schema.sql, 'public.users' references 'auth.users(id)'.
  // Can we just drop that foreign key constraint via the REST API? No.
  
  // Wait! What if we just create a new user, get their ID, and modify the hardcoded USER_ID in the React components?
  // YES!
  
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'dummy' + Math.random() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (authErr) { console.error('Auth Error:', authErr); return; }
  
  const userId = authData.user.id;
  console.log('Created Auth User:', userId);

  const { error: dbErr } = await supabase.from('users').insert([{
    id: userId,
    target_weight: 80,
    target_calories: 2100,
    target_protein: 180
  }]);

  if (dbErr) { console.error('DB Error:', dbErr); return; }
  console.log('Inserted into public.users successfully! New ID:', userId);
}
run();
