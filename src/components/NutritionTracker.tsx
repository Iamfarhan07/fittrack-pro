'use client';

import { useState, useEffect } from 'react';
import { fetchNutritionData } from '@/app/actions/nutrition';
import { supabase } from '@/lib/supabase';
import { Search, Save, Utensils, AlertCircle, Apple, Beef, Croissant, Droplets } from 'lucide-react';

export default function NutritionTracker({ userId }: { userId: string }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedFood, setParsedFood] = useState<any | null>(null);
  
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [meals, setMeals] = useState<any[]>([]);

  // Targets
  const targetCalories = 2100;
  const targetProtein = 180;
  const targetCarbs = 200;
  const targetFats = 65;

  useEffect(() => {
    fetchDailyMeals();
  }, [userId]);

  async function fetchDailyMeals() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (data) {
      setMeals(data);
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + Number(meal.calories),
        protein: acc.protein + Number(meal.protein),
        carbs: acc.carbs + Number(meal.carbs),
        fats: acc.fats + Number(meal.fats),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
      setDailyTotals(totals);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setParsedFood(null);

    try {
      const items = await fetchNutritionData(query);
      if (items && items.length > 0) {
        const aggregated = items.reduce((acc: any, item: any) => ({
          name: query, 
          calories: acc.calories + item.calories,
          protein_g: acc.protein_g + item.protein_g,
          carbohydrates_total_g: acc.carbohydrates_total_g + item.carbohydrates_total_g,
          fat_total_g: acc.fat_total_g + item.fat_total_g,
        }), { calories: 0, protein_g: 0, carbohydrates_total_g: 0, fat_total_g: 0 });
        
        setParsedFood({
          food_name: aggregated.name.charAt(0).toUpperCase() + aggregated.name.slice(1),
          calories: Math.round(aggregated.calories),
          protein: Math.round(aggregated.protein_g),
          carbs: Math.round(aggregated.carbohydrates_total_g),
          fats: Math.round(aggregated.fat_total_g),
        });
      } else {
        setError('We could not find nutrition info for that. Try something like "1 apple".');
      }
    } catch (err: any) {
      setError('Something went wrong checking the food. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!parsedFood) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase.from('meals').insert([{
      user_id: userId,
      date: today,
      ...parsedFood
    }]);

    if (!error) {
      setParsedFood(null);
      setQuery('');
      fetchDailyMeals();
    } else {
      console.error('Supabase Error:', error);
      setError(`Failed to save: ${error.message || 'Check connection'}.`);
    }
  }

  const getProgress = (current: number, target: number) => Math.min((current / target) * 100, 100);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
            <Apple size={18} />
          </div>
          <h2 className="text-lg font-bold text-white">Nutrition</h2>
        </div>
        <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700/50">Today</span>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-6">
        
        {/* Macros Grid */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Calories Main */}
          <div className="col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Calories</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{Math.round(dailyTotals.calories)}</span>
                  <span className="text-sm font-medium text-zinc-500">/ {targetCalories}</span>
                </div>
              </div>
              <FlameIcon className="text-orange-500/20 w-10 h-10 -mr-2 -mb-2" />
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full transition-all duration-700" style={{ width: `${getProgress(dailyTotals.calories, targetCalories)}%` }}></div>
            </div>
          </div>

          {/* Protein */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Beef size={12}/> Protein</p>
             <p className="text-lg font-bold text-white mb-2">{Math.round(dailyTotals.protein)}<span className="text-xs text-zinc-500 font-normal">/{targetProtein}g</span></p>
             <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${getProgress(dailyTotals.protein, targetProtein)}%` }}></div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Croissant size={12}/> Carbs</p>
             <p className="text-lg font-bold text-white mb-2">{Math.round(dailyTotals.carbs)}<span className="text-xs text-zinc-500 font-normal">/{targetCarbs}g</span></p>
             <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${getProgress(dailyTotals.carbs, targetCarbs)}%` }}></div>
            </div>
          </div>

        </div>

        {/* Input */}
        <div>
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-zinc-500 group-focus-within:text-white transition-colors" />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 2 eggs and a banana"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all shadow-inner"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute inset-y-1.5 right-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Track'}
            </button>
          </form>
          {error && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
        </div>

        {/* Edit Parsed Food */}
        {parsedFood && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-blue-500/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-white truncate pr-2">{parsedFood.food_name}</h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Verify</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Kcal', key: 'calories', color: 'text-orange-400' },
                { label: 'Pro', key: 'protein', color: 'text-blue-400' },
                { label: 'Carb', key: 'carbs', color: 'text-purple-400' },
                { label: 'Fat', key: 'fats', color: 'text-yellow-400' },
              ].map((item) => (
                <div key={item.key} className="bg-zinc-900 rounded-lg border border-zinc-800 p-1.5 text-center focus-within:border-zinc-500">
                  <label className={`block text-[9px] uppercase font-bold tracking-wider mb-0.5 ${item.color}`}>{item.label}</label>
                  <input 
                    type="number" 
                    value={parsedFood[item.key]} 
                    onChange={e => setParsedFood({...parsedFood, [item.key]: Number(e.target.value)})} 
                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-white text-center focus:outline-none focus:ring-0" 
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSave} className="w-full bg-white text-black hover:bg-zinc-200 py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors text-sm font-bold shadow-sm">
              <Save size={16} /> Log Meal
            </button>
          </div>
        )}

        {/* Logged Meals List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Diary</h3>
            <span className="text-xs text-zinc-600 font-medium">{meals.length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {meals.length > 0 ? meals.map((meal) => (
              <div key={meal.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors flex justify-between items-center group">
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-sm text-zinc-200 truncate capitalize">{meal.food_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium">
                    <span className="text-blue-400">{meal.protein}g P</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-purple-400">{meal.carbs}g C</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-yellow-500">{meal.fats}g F</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-orange-400">{meal.calories}</p>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-600">kcal</p>
                </div>
              </div>
            )) : (
               <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <Utensils size={24} className="text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No meals logged yet.</p>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple Flame Icon component for decoration
function FlameIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}
