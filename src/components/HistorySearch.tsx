'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, X, Utensils, Dumbbell, Activity } from 'lucide-react';

export default function HistorySearch({ userId }: { userId: string }) {
  const [date, setDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    setIsSearching(true);
    
    // Fetch Workout Data
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, workout_sets(exercise_name, weight_kg, reps)')
      .eq('user_id', userId)
      .eq('date', date);

    // Fetch Nutrition Data
    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);
      
    // Aggregate Workout Data
    let totalSets = 0;
    let totalVolume = 0;
    let exerciseList: string[] = [];
    
    if (workouts) {
      workouts.forEach((w: any) => {
        const validSets = w.workout_sets?.filter((s: any) => s.exercise_name !== 'WORKOUT_FINISHED') || [];
        totalSets += validSets.length;
        validSets.forEach((s: any) => {
          totalVolume += (s.weight_kg * s.reps);
          if (!exerciseList.includes(s.exercise_name)) {
            exerciseList.push(s.exercise_name);
          }
        });
      });
    }

    // Aggregate Nutrition Data
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    if (meals) {
      meals.forEach((m: any) => {
        totalCalories += Number(m.calories);
        totalProtein += Number(m.protein);
        totalCarbs += Number(m.carbs);
        totalFats += Number(m.fats);
      });
    }

    setReportData({
      date,
      workoutsFound: workouts && workouts.length > 0,
      mealsFound: meals && meals.length > 0,
      workout: { totalSets, totalVolume, exercises: exerciseList },
      nutrition: { calories: Math.round(totalCalories), protein: Math.round(totalProtein), carbs: Math.round(totalCarbs), fats: Math.round(totalFats), mealsCount: meals ? meals.length : 0 }
    });

    setIsSearching(false);
    setShowReport(true);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={16} className="text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl border border-zinc-700 transition-colors disabled:opacity-50"
        >
          {isSearching ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin" /> : <Search size={20} />}
        </button>
      </form>

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <button onClick={() => setShowReport(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="relative z-10 flex flex-col">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/80 pb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center">
                  <Activity size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Daily Report</h2>
                  <p className="text-zinc-400 text-sm">
                    {new Date(reportData.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {!reportData.workoutsFound && !reportData.mealsFound ? (
                <div className="py-10 text-center opacity-60">
                  <Search size={32} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium text-sm">No workouts or meals found for this date.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Workout Section */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Dumbbell size={14} className="text-blue-400" /> Workout Summary
                    </h3>
                    {reportData.workoutsFound ? (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Volume</p>
                          <p className="text-lg font-black text-white">{reportData.workout.totalVolume.toLocaleString()} <span className="text-xs font-medium text-zinc-500">kg</span></p>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Sets</p>
                          <p className="text-lg font-black text-white">{reportData.workout.totalSets}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">No workouts logged on this day.</p>
                    )}
                  </div>

                  {/* Nutrition Section */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Utensils size={14} className="text-orange-400" /> Nutrition Summary
                    </h3>
                    {reportData.mealsFound ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 bg-zinc-950 p-4 rounded-xl border border-orange-500/20">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-bold text-orange-500/70 uppercase tracking-wider">Total Calories</p>
                            <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">{reportData.nutrition.mealsCount} meals</span>
                          </div>
                          <p className="text-xl font-black text-orange-400">{reportData.nutrition.calories} <span className="text-xs font-medium text-orange-500/50">kcal</span></p>
                        </div>
                        
                        <div className="col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Protein</p>
                            <p className="font-bold text-white">{reportData.nutrition.protein}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Carbs</p>
                            <p className="font-bold text-white">{reportData.nutrition.carbs}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-1">Fats</p>
                            <p className="font-bold text-white">{reportData.nutrition.fats}g</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">No meals logged on this day.</p>
                    )}
                  </div>

                </div>
              )}

              <div className="mt-8">
                <button onClick={() => setShowReport(false)} className="w-full bg-white text-black py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-sm">
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
