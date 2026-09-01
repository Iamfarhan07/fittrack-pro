'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Dumbbell, Trophy, Plus, Trash2, ArrowRight, History as HistoryIcon, CheckCircle2, X, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

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

type MuscleGroup = keyof typeof EXERCISES;

export default function WorkoutTracker({ userId }: { userId: string }) {
  const [muscle, setMuscle] = useState<MuscleGroup>('Chest');
  const [exercise, setExercise] = useState(EXERCISES['Chest'][0]);
  
  const [setsInput, setSetsInput] = useState<{reps: string, weight: string}[]>([{ reps: '', weight: '' }]);
  
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [loggedSets, setLoggedSets] = useState<any[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<any[]>([]);
  const [previousBest, setPreviousBest] = useState<{weight: number, reps: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // UI States
  const [isFinished, setIsFinished] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  useEffect(() => {
    setExercise(EXERCISES[muscle][0]);
    if (!isFinished) checkOrCreateWorkout();
  }, [muscle, isFinished]);

  useEffect(() => {
    fetchPreviousBest();
  }, [exercise]);

  useEffect(() => {
    if (workoutId) fetchLoggedSets();
  }, [workoutId]);

  useEffect(() => {
    fetchPastWorkouts();
  }, [userId, isFinished]);

  async function checkOrCreateWorkout() {
    const today = new Date().toISOString().split('T')[0];
    let { data } = await supabase.from('workouts').select('id').eq('user_id', userId).eq('date', today).single();
    if (!data) {
      const { data: newWorkout } = await supabase.from('workouts').insert([{ user_id: userId, date: today, split_type: 'Push' }]).select().single();
      if (newWorkout) setWorkoutId(newWorkout.id);
    } else {
      setWorkoutId(data.id);
    }
  }

  async function fetchPastWorkouts() {
    const { data } = await supabase
      .from('workouts')
      .select('id, date, created_at, workout_sets(id, exercise_name, weight_kg, reps)')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    // Filter out empty workouts
    if (data) {
      const validHistory = data.filter(w => w.workout_sets && w.workout_sets.length > 0);
      setPastWorkouts(validHistory);
    }
  }

  async function fetchPreviousBest() {
    const { data } = await supabase
      .from('workout_sets')
      .select('weight_kg, reps')
      .eq('exercise_name', exercise)
      .order('weight_kg', { ascending: false })
      .order('reps', { ascending: false })
      .limit(1)
      .single();
    setPreviousBest(data ? { weight: data.weight_kg, reps: data.reps } : null);
  }

  async function fetchLoggedSets() {
    if (!workoutId) return;
    const { data } = await supabase.from('workout_sets').select('*').eq('workout_id', workoutId).order('timestamp', { ascending: true });
    if (data) setLoggedSets(data);
  }

  const addSetRow = () => setSetsInput([...setsInput, { reps: '', weight: '' }]);
  const removeSetRow = (index: number) => setSetsInput(setsInput.filter((_, i) => i !== index));
  const updateSetRow = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...setsInput];
    newSets[index][field] = value;
    setSetsInput(newSets);
  };

  async function handleSaveSets(e: React.FormEvent) {
    e.preventDefault();
    const validSets = setsInput.filter(s => s.reps !== '' && s.weight !== '');
    if (validSets.length === 0) return;

    if (!workoutId) {
      await checkOrCreateWorkout();
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('workouts').select('id').eq('user_id', userId).eq('date', today).single();
      if (!data) return;
      setWorkoutId(data.id);
      setIsSaving(true);
      const newSetsToInsert = validSets.map(set => ({
        workout_id: data.id,
        exercise_name: exercise,
        weight_kg: parseFloat(set.weight),
        reps: parseInt(set.reps),
      }));
      await supabase.from('workout_sets').insert(newSetsToInsert);
      fetchLoggedSets();
      setSetsInput([{ reps: '', weight: '' }]);
      fetchPreviousBest();
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const newSetsToInsert = validSets.map(set => ({
      workout_id: workoutId,
      exercise_name: exercise,
      weight_kg: parseFloat(set.weight),
      reps: parseInt(set.reps),
    }));
    await supabase.from('workout_sets').insert(newSetsToInsert);
    fetchLoggedSets();
    setSetsInput([{ reps: '', weight: '' }]);
    fetchPreviousBest();
    setIsSaving(false);
  }

  const handleFinishWorkout = () => {
    setShowReport(true);
  };

  const closeReport = () => {
    setShowReport(false);
    setIsFinished(true); // Hide logger and show success state
    setWorkoutId(null);
    setLoggedSets([]);
  };

  // Calculate Report Stats for current session
  const totalSets = loggedSets.length;
  const totalVolume = loggedSets.reduce((acc, set) => acc + (set.weight_kg * set.reps), 0);
  const uniqueExercises = new Set(loggedSets.map(set => set.exercise_name)).size;

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Dumbbell size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">Workout Log</h2>
          </div>
          
          {!isFinished && (
            <select 
              value={muscle} 
              onChange={(e) => setMuscle(e.target.value as MuscleGroup)}
              className="appearance-none bg-zinc-950 border border-zinc-700/80 rounded-full pl-3 pr-8 py-1 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-zinc-600 shadow-sm cursor-pointer"
            >
              {Object.keys(EXERCISES).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        {isFinished ? (
          <div className="p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Session Complete!</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-sm">Your workout has been securely saved to your history. Awesome work today!</p>
            <button onClick={() => { setIsFinished(false); checkOrCreateWorkout(); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
              Log Another Session
            </button>
          </div>
        ) : (
          <div className="p-5 flex flex-col md:flex-row gap-8">
            {/* Left Side: Logger Form */}
            <div className="flex-1 space-y-5">
              <form onSubmit={handleSaveSets}>
                <div className="mb-5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Exercise</label>
                  <select 
                    value={exercise} 
                    onChange={(e) => setExercise(e.target.value)}
                    className="appearance-none w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-zinc-600 transition-all cursor-pointer shadow-inner"
                  >
                    {EXERCISES[muscle].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>

                {previousBest && (
                  <div className="mb-5 flex items-center justify-between bg-yellow-500/5 px-4 py-2.5 rounded-lg border border-yellow-500/10 text-sm">
                    <span className="flex items-center gap-2 text-yellow-600/80 font-medium text-xs uppercase tracking-wider">
                      <Trophy size={14} /> PR
                    </span>
                    <span className="text-zinc-300 font-bold tracking-wide">
                      {previousBest.weight}kg <span className="text-zinc-600 font-normal px-1">×</span> {previousBest.reps}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    <div className="w-8"></div>
                    <div className="flex-1 text-center">Weight (kg)</div>
                    <div className="flex-1 text-center">Reps</div>
                    <div className="w-8"></div>
                  </div>
                  
                  {setsInput.map((set, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="w-8 text-center text-xs font-bold text-zinc-600">{index + 1}</div>
                      
                      <input 
                        type="number" min="0" step="0.5" placeholder="-"
                        value={set.weight} onChange={(e) => updateSetRow(index, 'weight', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 text-center text-sm font-semibold text-white focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                      
                      <input 
                        type="number" min="1" placeholder="-"
                        value={set.reps} onChange={(e) => updateSetRow(index, 'reps', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 text-center text-sm font-semibold text-white focus:outline-none focus:border-zinc-500 transition-colors"
                      />

                      <div className="w-8 flex justify-center">
                        {setsInput.length > 1 ? (
                          <button type="button" onClick={() => removeSetRow(index)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={16} />
                          </button>
                        ) : <div className="w-4"></div>}
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={addSetRow} className="w-full py-2 mt-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
                    <Plus size={14} /> Add Set
                  </button>
                </div>

                <button type="submit" disabled={isSaving} className="w-full mt-6 bg-white hover:bg-zinc-200 text-black py-3 rounded-xl flex justify-center items-center gap-2 transition-colors font-bold shadow-sm disabled:opacity-50">
                  {isSaving ? 'Logging...' : 'Log Sets'}
                </button>
              </form>
            </div>

            {/* Right Side: Logged Sets */}
            <div className="w-full md:w-64 flex flex-col border-t md:border-t-0 md:border-l border-zinc-800/80 pt-6 md:pt-0 md:pl-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Today's Sets</h3>
                <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{totalSets}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[290px] custom-scrollbar mb-4">
                {loggedSets.length > 0 ? loggedSets.map((set, i) => (
                  <div key={set.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-0.5 truncate max-w-[120px]">{set.exercise_name}</p>
                      <p className="text-sm font-bold text-white tracking-wide">
                        {set.weight_kg}kg <span className="text-zinc-600 font-normal px-0.5">×</span> {set.reps}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      #{i+1}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                    <HistoryIcon size={24} className="text-zinc-600 mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">No sets logged yet.</p>
                  </div>
                )}
              </div>

              {/* Finish Workout Button */}
              <button 
                onClick={handleFinishWorkout}
                disabled={loggedSets.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl flex justify-center items-center gap-2 transition-colors font-bold shadow-sm disabled:opacity-30"
              >
                <CheckCircle2 size={18} /> Finish Workout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- SESSION HISTORY SECTION --- */}
      {pastWorkouts.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <CalendarDays size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">Session History</h2>
          </div>
          
          <div className="p-5">
            <div className="space-y-3">
              {pastWorkouts.map((workout) => {
                const wSets = workout.workout_sets || [];
                const wVolume = wSets.reduce((acc: number, s: any) => acc + (s.weight_kg * s.reps), 0);
                const isExpanded = expandedHistory === workout.id;
                
                return (
                  <div key={workout.id} className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden transition-all duration-300">
                    <div 
                      onClick={() => setExpandedHistory(isExpanded ? null : workout.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">
                          {new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{wSets.length} sets • {wVolume.toLocaleString()} kg volume</p>
                      </div>
                      <div className="text-zinc-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/20">
                        <div className="space-y-2">
                          {wSets.map((s: any, i: number) => (
                            <div key={s.id} className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-800/30 last:border-0">
                              <div className="flex gap-3 items-center">
                                <span className="text-xs font-bold text-zinc-600">#{i+1}</span>
                                <span className="text-zinc-300">{s.exercise_name}</span>
                              </div>
                              <span className="font-bold text-white">{s.weight_kg}kg <span className="text-zinc-600 font-normal px-1">×</span> {s.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
            
            <button onClick={closeReport} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mb-4">
                <Trophy size={32} className="text-blue-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Workout Complete!</h2>
              <p className="text-zinc-400 text-sm mb-8">Great job crushing your session today. Here is your daily summary.</p>

              <div className="w-full grid grid-cols-2 gap-3 mb-8">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Volume</p>
                  <p className="text-2xl font-black text-white">{totalVolume.toLocaleString()} <span className="text-sm font-medium text-zinc-500">kg</span></p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Sets</p>
                  <p className="text-2xl font-black text-white">{totalSets}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 col-span-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Exercises Performed</p>
                  <p className="text-xl font-bold text-blue-400">{uniqueExercises}</p>
                </div>
              </div>

              <button onClick={closeReport} className="w-full bg-white text-black py-3.5 rounded-xl font-bold transition-transform active:scale-95 shadow-sm">
                Close Report & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
