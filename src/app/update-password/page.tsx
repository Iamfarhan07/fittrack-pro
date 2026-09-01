
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is actually authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      // Success, redirect to dashboard
      router.push('/');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-zinc-800 rounded-2xl text-white border border-zinc-700 shadow-inner">
              <ShieldCheck size={36} className="text-blue-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2">Set New Password</h2>
          <p className="text-zinc-400 text-sm text-center mb-8">
            Please enter your new secure password below.
          </p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
