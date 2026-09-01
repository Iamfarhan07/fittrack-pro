'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { Activity, BicepsFlexed, Flame } from 'lucide-react';

const EXERCISES: Record<string, string[]> = {
  'Chest': [
    'Barbell Bench Press', 'Incline Barbell Bench Press', 'Decline Bench Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Flyes',
    'Cable Crossover', 'Pec Deck Machine', 'Push-Ups', 'Dips (chest-focused)', 'Machine Chest Press'
  ],
  'Back': [
    'Deadlift', 'Pull-Ups / Chin-Ups', 'Lat Pulldown', 'Bent-Over Barbell Row',
    'Seated Cable Row', 'One-Arm Dumbbell Row', 'T-Bar Row', 'Face Pulls',
    'Straight-Arm Pulldown', 'Hyperextensions (lower back)'
  ],
  'Shoulders': [
    'Overhead Barbell Press', 'Seated Dumbbell Shoulder Press', 'Arnold Press',
    'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Cable Lateral Raise',
    'Upright Row', 'Shrugs (traps)'
  ],
  'Biceps': [
    'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
    'Incline Dumbbell Curl', 'Cable Curl', 'Concentration Curl', 'Chin-Ups (bicep-focused)'
  ],
  'Triceps': [
    'Close-Grip Bench Press', 'Tricep Pushdown (rope/bar)', 'Skull Crushers',
    'Overhead Tricep Extension', 'Dips (tricep-focused)', 'Kickbacks', 'Diamond Push-Ups'
  ],
  'Quadriceps': [
    'Barbell Back Squat', 'Front Squat', 'Leg Press', 'Walking Lunges',
    'Leg Extension', 'Bulgarian Split Squat', 'Goblet Squat', 'Step-Ups'
  ],
  'Hamstrings & Glutes': [
    'Romanian Deadlift', 'Lying Leg Curl', 'Seated Leg Curl', 'Hip Thrust',
    'Glute Bridge', 'Good Mornings', 'Cable Pull-Through', 'Sumo Deadlift'
  ],
  'Calves': [
    'Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise',
    'Donkey Calf Raise', 'Single-Leg Calf Raise'
  ],
  'Abs & Core': [
    'Plank', 'Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel Rollout',
    'Russian Twists', 'Bicycle Crunch', 'Sit-Ups / Crunches', 'Side Plank', 'Woodchopper'
  ],
  'Forearms': [
    'Wrist Curl', 'Reverse Wrist Curl', 'Farmer\'s Carry', 'Reverse Curl', 'Plate Pinch Hold'
  ],
  'Full Body': [
    'Clean and Jerk', 'Snatch', 'Kettlebell Swing', 'Burpees', 'Thruster',
    'Battle Ropes', 'Sled Push/Pull'
  ]
};

export default function Dashboard({ userId }: { userId: string }) {
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [muscleVolumeData, setMuscleVolumeData] = useState<any[]>([]);

  useEffect(() => {
    fetchNutritionData();
    fetchVolumeData();
  }, [userId]);

  useEffect(() => {
    const mealSub = supabase.channel('meals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchNutritionData)
      .subscribe();
      
    const workoutSub = supabase.channel('workouts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sets' }, fetchVolumeData)
      .subscribe();

    return () => {
      supabase.removeChannel(mealSub);
      supabase.removeChannel(workoutSub);
    };
  }, [userId]);

  async function fetchNutritionData() {
    const { data } = await supabase
      .from('meals')
      .select('date, calories')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (data && data.length > 0) {
      const caloriesByDate = data.reduce((acc: any, meal: any) => {
        const dateStr = new Date(meal.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!acc[dateStr]) acc[dateStr] = 0;
        acc[dateStr] += Number(meal.calories);
        return acc;
      }, {});

      const formatted = Object.keys(caloriesByDate).map(date => ({
        date,
        calories: Math.round(caloriesByDate[date])
      }));
      setNutritionData(formatted);
    } else {
      setNutritionData([]);
    }
  }

  async function fetchVolumeData() {
    const { data } = await supabase
      .from('workout_sets')
      .select(`
        weight_kg, reps, exercise_name,
        workouts!inner(user_id)
      `)
      .eq('workouts.user_id', userId);

    if (data && data.length > 0) {
      const volumeByMuscle: Record<string, number> = {
        Chest: 0, Back: 0, Shoulders: 0, Legs: 0, Arms: 0
      };

      data.forEach((row: any) => {
        const volume = Number(row.weight_kg) * Number(row.reps);
        let foundMuscle = 'Other';
        for (const [muscle, exercises] of Object.entries(EXERCISES)) {
          if (exercises.includes(row.exercise_name)) {
            foundMuscle = muscle;
            break;
          }
        }
        if (volumeByMuscle[foundMuscle] !== undefined) {
          volumeByMuscle[foundMuscle] += volume;
        }
      });

      const formatted = Object.keys(volumeByMuscle)
        .filter(m => volumeByMuscle[m] > 0)
        .map(muscle => ({
          muscle,
          volume: volumeByMuscle[muscle]
        }))
        .sort((a, b) => b.volume - a.volume); 
        
      setMuscleVolumeData(formatted);
    } else {
      setMuscleVolumeData([]);
    }
  }

  const CustomTooltip = ({ active, payload, label, suffix = '' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 p-3 border border-zinc-800 rounded-xl shadow-2xl">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
          <p className="text-white font-bold text-base">
            {payload[0].value.toLocaleString()} <span className="text-xs font-medium text-zinc-500">{suffix}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']; 

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Nutrition Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-400 border border-orange-500/20">
            <Flame size={16} />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">Daily Calories</h3>
        </div>
        
        <div className="h-60 w-full flex-1">
          {nutritionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={nutritionData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip suffix="kcal" />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCalories)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <Flame size={24} className="text-zinc-500 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Log a meal to see trends</p>
            </div>
          )}
        </div>
      </div>

      {/* Volume Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <BicepsFlexed size={16} />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">Volume by Muscle</h3>
        </div>

        <div className="h-60 w-full flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-h-[160px]">
            {muscleVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleVolumeData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="muscle" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} hide />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip suffix="kg" />} cursor={{ fill: '#18181b', opacity: 0.5 }} />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                    {muscleVolumeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <BicepsFlexed size={24} className="text-zinc-500 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Log a workout to see volume</p>
              </div>
            )}
          </div>
          
          {/* Explicit Numbers List */}
          {muscleVolumeData.length > 0 && (
            <div className="w-full xl:w-32 flex flex-col justify-center space-y-3">
              {muscleVolumeData.map((data, index) => (
                <div key={data.muscle} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-zinc-400 font-medium">{data.muscle}</span>
                  </div>
                  <span className="text-white font-bold">{data.volume.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
