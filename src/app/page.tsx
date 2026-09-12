'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NutritionTracker from '@/components/NutritionTracker';
import WorkoutTracker from '@/components/WorkoutTracker';
import Dashboard from '@/components/Dashboard';
import HistorySearch from '@/components/HistorySearch';
import { Activity, Dumbbell, Apple, LogOut, Sparkles } from 'lucide-react';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/update-password');
      } else if (session?.user) {
        setUserId(session.user.id);
      } else {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/login');
    } else {
      setUserId(session.user.id);
      const { data: userProfile } = await supabase.from('users').select('id').eq('id', session.user.id).single();
      if (!userProfile) {
        router.push('/onboarding');
        return;
      }
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-medium tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-6 lg:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Sleek Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 shadow-inner">
              <Activity size={28} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                FitTrack <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs uppercase tracking-widest border border-blue-500/20">Pro</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-0.5">Your personal body recomposition workspace.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-full border border-zinc-800/80">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs font-medium text-zinc-300">
                <Apple size={14} className="text-green-400" /> Nutrition
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs font-medium text-zinc-300">
                <Dumbbell size={14} className="text-blue-400" /> Workouts
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-red-500/10 px-4 py-2 rounded-full border border-zinc-800 hover:border-red-500/30 text-sm font-medium text-zinc-400 hover:text-red-400 transition-all"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Bento Box Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Column (Charts & Workout) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Welcome Banner & Search */}
            <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-900/30 rounded-2xl p-5 relative overflow-hidden flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-400" /> Ready to crush your goals today?
                </h2>
                <p className="text-zinc-400 text-sm max-w-xl">
                  Log your meals and workouts below, or search your history.
                </p>
              </div>
              
              <div className="relative z-10 w-full xl:w-auto">
                <HistorySearch userId={userId} />
              </div>
            </div>

            {/* Analytics Dashboard */}
            <Dashboard userId={userId} />

            {/* Workout Tracker */}
            <WorkoutTracker userId={userId} />

          </div>

          {/* Right Column (Nutrition) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <NutritionTracker userId={userId} />
          </div>

        </div>

      </div>
    </main>
  );
}
