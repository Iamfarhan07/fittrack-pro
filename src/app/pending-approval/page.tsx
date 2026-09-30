'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, Dumbbell, PhoneCall } from 'lucide-react';

export default function PendingApproval() {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Clock size={40} className="text-yellow-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">Access Pending</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Your account has been created successfully! Your gym administrator needs to activate your subscription before you can access the dashboard.
          </p>

          {/* Info Card */}
          <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 mb-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <PhoneCall size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">Contact Your Gym Admin</p>
                <p className="text-xs text-zinc-500">Pay your monthly subscription fee to your gym owner. They will activate your account manually.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Dumbbell size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">Get Full Access</p>
                <p className="text-xs text-zinc-500">Once activated, you'll have full access to workout tracking, nutrition logging, analytics, and more.</p>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Sign out with a different account
          </button>
        </div>
      </div>
    </main>
  );
}
