'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, ArrowLeft, Send } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isResetting) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (resetError) throw resetError;
        setMessage('Check your email for the password reset link.');
      } else if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/');
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 shadow-inner">
              <Activity size={36} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isResetting ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-zinc-400 text-sm text-center mb-8">
            {isResetting 
              ? 'Enter your email to receive a reset link' 
              : (isLogin ? 'Sign in to access your dashboard' : 'Start your fitness journey today')}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {!isResetting && (
              <div>
                <div className="flex justify-between items-end mb-2 pl-1 pr-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
                  {isLogin && (
                    <button type="button" onClick={() => { setIsResetting(true); setError(''); setMessage(''); }} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="password" 
                    required={!isResetting}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg">
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : (
                isResetting ? <><Send size={18} /> Send Reset Link</> : (isLogin ? 'Sign In' : 'Sign Up')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {isResetting ? (
              <button onClick={() => { setIsResetting(false); setError(''); setMessage(''); }} className="text-sm font-medium text-zinc-400 hover:text-white flex items-center justify-center gap-2 w-full transition-colors">
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            ) : (
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
