
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://rwqcwzwapgbicigvumdb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cWN3endhcGdiaWNpZ3Z1bWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc0MzQ5OSwiZXhwIjoyMTAzMzE5NDk5fQ.AAzxrMi0paI-5iOpUWd3QP06pvi6cegwnLktaNF8rUQ'
);
async function run() {
  const { data, error } = await supabase.from('workouts').select('id, date, workout_sets(id, exercise_name, weight_kg, reps)').limit(2);
  console.log(JSON.stringify({data, error}));
}
run();
