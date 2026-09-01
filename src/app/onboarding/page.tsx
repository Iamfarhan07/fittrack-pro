'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, ArrowLeft, Activity, Target, Calendar, 
  Heart, User, Scale, Ruler, Dumbbell, Clock, CalendarDays,
  Flame, TrendingUp, HeartPulse, CheckCircle2, Home, Building2
} from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- Step 1: Goal ---
  const [goal, setGoal] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [timeline, setTimeline] = useState('');
  const [reason, setReason] = useState('');

  // --- Step 2: Baseline ---
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male'|'female'|''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'kg'|'lb'>('kg');

  // --- Step 3: Training & Environment ---
  const [experience, setExperience] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionLength, setSessionLength] = useState('');
  const [environment, setEnvironment] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, []);

  const toggleEquipment = (item: string) => {
    setEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  async function handleComplete() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Conversions for calculation if lb
    const w = units === 'lb' ? parseFloat(weight) * 0.453592 : parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    
    // BMR (Mifflin-St Jeor)
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += gender === 'male' ? 5 : -161;

    // Active multiplier based on days per week
    let multiplier = 1.2;
    if (daysPerWeek >= 1 && daysPerWeek <= 2) multiplier = 1.375;
    else if (daysPerWeek >= 3 && daysPerWeek <= 5) multiplier = 1.55;
    else if (daysPerWeek >= 6) multiplier = 1.725;

    let tdee = bmr * multiplier;
    let targetCals = Math.round(tdee);
    let finalTargetWeight = w;
    
    if (goal === 'Lose weight / fat') {
      targetCals -= 500;
      finalTargetWeight = targetWeight ? (units === 'lb' ? parseFloat(targetWeight)*0.453592 : parseFloat(targetWeight)) : w - 5;
    } else if (goal === 'Build muscle') {
      targetCals += 300;
      finalTargetWeight = targetWeight ? (units === 'lb' ? parseFloat(targetWeight)*0.453592 : parseFloat(targetWeight)) : w + 5;
    } else if (targetWeight) {
      finalTargetWeight = units === 'lb' ? parseFloat(targetWeight)*0.453592 : parseFloat(targetWeight);
    }

    const targetProtein = Math.round(w * 2);

    // 1. Store Questionnaire Metadata in Auth User (JSON)
    await supabase.auth.updateUser({
      data: { 
        name,
        onboarding_data: {
          goal, targetWeight, timeline, reason,
          age, gender, height, weight, units,
          experience, daysPerWeek, sessionLength, environment, equipment
        }
      }
    });

    // 2. Insert Core Targets to DB
    await supabase.from('users').insert([{
      id: session.user.id,
      target_weight: finalTargetWeight,
      target_calories: targetCals,
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

  // Next buttons logic
  const isStep1Valid = goal !== '';
  const isStep2Valid = name !== '' && age !== '' && gender !== '' && height !== '' && weight !== '';
  const isStep3Valid = experience !== '' && sessionLength !== '' && environment !== '';

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col min-h-[500px]">
          
          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
            ))}
          </div>

          {/* --- STEP 1: GOALS --- */}
          {step === 1 && (
            <div className="flex-1 animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Target className="text-blue-500" /> Defining Your Path</h1>
                <p className="text-zinc-400">Let's start with what you want to achieve.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Primary Goal</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: 'Lose weight / fat', icon: Flame },
                      { title: 'Build muscle', icon: BicepsFlexed },
                      { title: 'Get stronger (PRs)', icon: TrendingUp },
                      { title: 'General health', icon: HeartPulse }
                    ].map(item => (
                      <button 
                        key={item.title} 
                        onClick={() => setGoal(item.title)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${goal === item.title ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}
                      >
                        <item.icon size={20} className={goal === item.title ? "text-blue-400" : "text-zinc-500"} />
                        <span className="font-semibold text-sm">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Target Weight (Optional)</label>
                    <input type="number" placeholder="e.g. 75" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Target Date (Optional)</label>
                    <input type="date" value={timeline} onChange={e => setTimeline(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Why does this matter to you?</label>
                  <textarea 
                    value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="E.g. I want to feel confident, run a 5K, keep up with my kids..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 transition-colors h-24 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2: BASELINE --- */}
          {step === 2 && (
            <div className="flex-1 animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><User className="text-blue-500" /> Your Baseline</h1>
                <p className="text-zinc-400">We need this data to calibrate your personalized targets.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors" placeholder="John Doe" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Age</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors" placeholder="e.g. 28" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Biological Sex (for BMR)</label>
                    <div className="grid grid-cols-2 gap-2 h-[46px]">
                      <button onClick={() => setGender('male')} className={`rounded-xl border text-sm font-bold transition-all ${gender === 'male' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>Male</button>
                      <button onClick={() => setGender('female')} className={`rounded-xl border text-sm font-bold transition-all ${gender === 'female' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>Female</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Height (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 transition-colors" placeholder="175" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Current Weight</label>
                      <div className="flex bg-zinc-800 rounded-md p-0.5">
                        <button onClick={() => setUnits('kg')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${units==='kg'?'bg-zinc-600 text-white':'text-zinc-500'}`}>KG</button>
                        <button onClick={() => setUnits('lb')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${units==='lb'?'bg-zinc-600 text-white':'text-zinc-500'}`}>LB</button>
                      </div>
                    </div>
                    <div className="relative">
                      <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 transition-colors" placeholder={`e.g. ${units === 'kg' ? '70' : '155'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3: LIFESTYLE & TRAINING --- */}
          {step === 3 && (
            <div className="flex-1 animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Dumbbell className="text-blue-500" /> Training Details</h1>
                <p className="text-zinc-400">Tailoring the experience to your lifestyle.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Experience Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                      <button key={lvl} onClick={() => setExperience(lvl)} className={`py-3 rounded-xl border text-sm font-bold transition-all ${experience === lvl ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Days per week you can commit</label>
                    <span className="text-blue-400 font-bold text-sm">{daysPerWeek} Days</span>
                  </div>
                  <input type="range" min="1" max="7" value={daysPerWeek} onChange={e => setDaysPerWeek(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-zinc-600 font-bold mt-2">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Environment</label>
                    <select value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 transition-colors appearance-none">
                      <option value="" disabled>Select...</option>
                      <option value="Home">Home</option>
                      <option value="Commercial Gym">Commercial Gym</option>
                      <option value="Outdoors">Outdoors</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Avg Session Length</label>
                    <select value={sessionLength} onChange={e => setSessionLength(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 transition-colors appearance-none">
                      <option value="" disabled>Select...</option>
                      <option value="15-30 min">15–30 min</option>
                      <option value="30-45 min">30–45 min</option>
                      <option value="45-60 min">45–60 min</option>
                      <option value="60+ min">60+ min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Equipment Access</label>
                  <div className="flex flex-wrap gap-2">
                    {['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Machines', 'Cardio'].map(eq => (
                      <button 
                        key={eq} onClick={() => toggleEquipment(eq)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${equipment.includes(eq) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                      >{eq}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-12 pt-6 border-t border-zinc-800/50">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft size={18} /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)} 
                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                className={`flex-1 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none ${step===1?'w-full':''}`}
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleComplete} 
                disabled={!isStep3Valid || loading}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {loading ? 'Finalizing Profile...' : <><CheckCircle2 size={18}/> Finish & Build Plan</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

// Custom icon for Goal Selection
function BicepsFlexed(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.4 17.6a5.5 5.5 0 0 1-7.9-7.9L7 5l6.5 6.5a1.5 1.5 0 0 0 2.12-2.12l-6.5-6.5 4.5-4.5a5.5 5.5 0 0 1 7.9 7.9l-2.5 2.5a3 3 0 0 1-4.24 4.24l-2.5 2.5a3 3 0 0 1-4.24-4.24z"/>
    </svg>
  );
}
