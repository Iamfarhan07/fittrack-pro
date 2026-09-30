'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Shield, Users, ArrowLeft, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Dumbbell, LogOut, Activity,
  ToggleLeft, ToggleRight, User
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  has_access: boolean;
  is_admin: boolean;
  created_at: string;
  target_weight: number;
  target_calories: number;
}

interface WorkoutSet {
  id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  timestamp: string;
}

interface Workout {
  id: string;
  date: string;
  split_type: string;
  created_at: string;
  workout_sets: WorkoutSet[];
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/login'); return; }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) { router.push('/'); return; }

    await fetchUsers();
    setLoading(false);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, has_access, is_admin, created_at, target_weight, target_calories')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
  }

  async function toggleAccess(userId: string, currentAccess: boolean) {
    setTogglingId(userId);
    await supabase
      .from('users')
      .update({ has_access: !currentAccess })
      .eq('id', userId);

    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, has_access: !currentAccess } : u)
    );
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, has_access: !currentAccess } : null);
    }
    setTogglingId(null);
  }

  async function viewUserWorkouts(user: UserProfile) {
    setSelectedUser(user);
    setLoadingWorkouts(true);
    setExpandedWorkout(null);

    const { data } = await supabase
      .from('workouts')
      .select('id, date, split_type, created_at, workout_sets(id, exercise_name, weight_kg, reps, timestamp)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (data) {
      // Filter out WORKOUT_FINISHED markers and sort sets by timestamp
      const cleaned = data.map((w: any) => ({
        ...w,
        workout_sets: (w.workout_sets || [])
          .filter((s: WorkoutSet) => s.exercise_name !== 'WORKOUT_FINISHED')
          .sort((a: WorkoutSet, b: WorkoutSet) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
      })).filter((w: any) => w.workout_sets.length > 0);

      setUserWorkouts(cleaned);
    }
    setLoadingWorkouts(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-medium tracking-wide">Verifying admin access...</p>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.has_access && !u.is_admin).length;
  const pendingUsers = users.filter(u => !u.has_access && !u.is_admin).length;

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
              <Shield size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Admin Panel</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Manage member access and subscriptions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-white transition-all"
            >
              <Activity size={16} /> Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-red-500/10 px-4 py-2 rounded-full border border-zinc-800 hover:border-red-500/30 text-sm font-medium text-zinc-400 hover:text-red-400 transition-all"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Members</p>
            <p className="text-3xl font-black text-white">{users.filter(u => !u.is_admin).length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Active</p>
            <p className="text-3xl font-black text-green-400">{activeUsers}</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Pending Activation</p>
            <p className="text-3xl font-black text-yellow-400">{pendingUsers}</p>
          </div>
        </div>

        {/* Two column layout: Users Table + Workout Report */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left: User Table */}
          <div className="xl:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3">
              <Users size={18} className="text-blue-400" />
              <h2 className="text-base font-bold text-white">Members</h2>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {users.filter(u => !u.is_admin).length === 0 && (
                <div className="p-8 text-center text-zinc-600 text-sm">No members registered yet.</div>
              )}
              {users.filter(u => !u.is_admin).map(user => (
                <div
                  key={user.id}
                  onClick={() => viewUserWorkouts(user)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-zinc-800/50 ${selectedUser?.id === user.id ? 'bg-zinc-800/50 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.full_name || 'Unnamed User'}</p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user.has_access ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {user.has_access ? 'Active' : 'Pending'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleAccess(user.id, user.has_access); }}
                      disabled={togglingId === user.id}
                      className="transition-transform active:scale-90 disabled:opacity-50"
                      title={user.has_access ? 'Revoke Access' : 'Grant Access'}
                    >
                      {user.has_access
                        ? <ToggleRight size={28} className="text-green-400" />
                        : <ToggleLeft size={28} className="text-zinc-600" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Workout Report */}
          <div className="xl:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3">
              <Dumbbell size={18} className="text-purple-400" />
              <h2 className="text-base font-bold text-white">
                {selectedUser ? `${selectedUser.full_name || 'User'}'s Workout Report` : 'Workout Report'}
              </h2>
            </div>

            {!selectedUser && (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50">
                <Users size={32} className="text-zinc-600 mb-3" />
                <p className="text-zinc-400 text-sm font-medium">Click on a member to view their workout history.</p>
              </div>
            )}

            {selectedUser && loadingWorkouts && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {selectedUser && !loadingWorkouts && (
              <div className="flex-1 flex flex-col">
                {/* User meta card */}
                <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/50 flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Cals</p>
                    <p className="text-sm font-black text-orange-400">{selectedUser.target_calories ?? '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Weight</p>
                    <p className="text-sm font-black text-blue-400">{selectedUser.target_weight ? `${selectedUser.target_weight} kg` : '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${selectedUser.has_access ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {selectedUser.has_access ? '✓ Active' : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sessions Logged</p>
                    <p className="text-sm font-black text-white">{userWorkouts.length}</p>
                  </div>
                </div>

                {/* Workout table */}
                {userWorkouts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50">
                    <Dumbbell size={28} className="text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm">No workouts logged yet.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[520px] custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-zinc-900 z-10">
                        <tr className="border-b border-zinc-800">
                          <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                          <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Split</th>
                          <th className="text-center p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sets</th>
                          <th className="text-right p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Volume</th>
                          <th className="text-center p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {userWorkouts.map(workout => {
                          const vol = workout.workout_sets.reduce((acc, s) => acc + s.weight_kg * s.reps, 0);
                          const isExpanded = expandedWorkout === workout.id;
                          // Group sets by exercise
                          const exerciseMap: Record<string, WorkoutSet[]> = {};
                          workout.workout_sets.forEach(s => {
                            if (!exerciseMap[s.exercise_name]) exerciseMap[s.exercise_name] = [];
                            exerciseMap[s.exercise_name].push(s);
                          });

                          return (
                            <>
                              <tr
                                key={workout.id}
                                className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                              >
                                <td className="p-4 text-zinc-300 font-medium">
                                  {new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="p-4">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                    workout.split_type === 'Push' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    workout.split_type === 'Pull' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    workout.split_type === 'Legs' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                  }`}>
                                    {workout.split_type || 'General'}
                                  </span>
                                </td>
                                <td className="p-4 text-center text-white font-bold">{workout.workout_sets.length}</td>
                                <td className="p-4 text-right text-white font-bold">{vol.toLocaleString()} <span className="text-zinc-500 font-normal text-xs">kg</span></td>
                                <td className="p-4 text-center text-zinc-500">
                                  {isExpanded ? <ChevronUp size={16} className="mx-auto" /> : <ChevronDown size={16} className="mx-auto" />}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${workout.id}-detail`} className="bg-zinc-950/50">
                                  <td colSpan={5} className="px-4 pb-4 pt-2">
                                    <div className="space-y-3">
                                      {Object.entries(exerciseMap).map(([exercise, sets]) => (
                                        <div key={exercise}>
                                          <p className="text-xs font-bold text-zinc-400 mb-1.5">{exercise}</p>
                                          <div className="flex flex-wrap gap-2">
                                            {sets.map((s, i) => (
                                              <span key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-300 font-medium">
                                                Set {i + 1}: {s.weight_kg}kg × {s.reps}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
