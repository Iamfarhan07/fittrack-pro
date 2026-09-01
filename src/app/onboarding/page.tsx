
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Activity, ArrowRight, Scale, Ruler, Calendar, Target } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male'|'female'>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'lose'|'maintain'|'gain'>('maintain');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, []);

  async function handleComplete() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Basic BMR Calculation (Mifflin-St Jeor)
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += gender === 'male' ? 5 : -161;

    // Active multiplier (assume moderate)
    let tdee = bmr * 1.55;

    let targetCalories = Math.round(tdee);
    let targetWeight = w;
    if (goal === 'lose') {
      targetCalories -= 500;
      targetWeight = w - 5; // Arbitrary 5kg goal
    } else if (goal === 'gain') {
      targetCalories += 300;
      targetWeight = w + 5;
    }

    // Protein rule of thumb: ~2g per kg of bodyweight
    const targetProtein = Math.round(w * 2);

    // 1. Update Auth Metadata (Name)
    await supabase.auth.updateUser({
      data: { name: name }
    });

    // 2. Insert into public.users
    await supabase.from('users').insert([{
      id: session.user.id,
      target_weight: targetWeight,
      target_calories: targetCalories,
      target_protein: targetProtein
    }]);

    // 3. Log initial weight
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('weight_logs').insert([{
      user_id: session.user.id,
      date: today,
      weight_kg: w
    }]);

    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Activity size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">Let's set you up</h1>
          </div>

          <div className="space-y-6">
            {step === 1 && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">What's your name?</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="25" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Biological Sex (for BMR)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setGender('male')} className={py-3 rounded-xl border text-sm font-bold transition-all }>Male</button>
                    <button onClick={() => setGender('female')} className={py-3 rounded-xl border text-sm font-bold transition-all }>Female</button>
                  </div>
                </div>
                <button onClick={() => name && age ? setStep(2) : null} className="w-full mt-4 bg-white text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="175" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Current Weight (kg)</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="70.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Your Goal</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setGoal('lose')} className={py-3 rounded-xl border text-xs font-bold transition-all }>Lose Fat</button>
                    <button onClick={() => setGoal('maintain')} className={py-3 rounded-xl border text-xs font-bold transition-all }>Maintain</button>
                    <button onClick={() => setGoal('gain')} className={py-3 rounded-xl border text-xs font-bold transition-all }>Build Muscle</button>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(1)} className="w-1/3 bg-zinc-800 text-white py-3.5 rounded-xl font-bold transition-transform active:scale-95">Back</button>
                  <button onClick={handleComplete} disabled={loading || !height || !weight} className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {loading ? 'Setting up...' : 'Calculate Targets'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </main>
  );
}
