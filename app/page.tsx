"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Brain, History, LogIn, TrendingUp,
  PlusCircle, CheckCircle2, Flame,
  Zap, Droplets, Info, Clock, LogOut, Loader2, Trophy, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Phase = {
  id: number; start: number; end: number; title: string;
  short: string; fuel: string; organs: string[]; notes: string;
};

const PHASES: Phase[] = [
  { id:1, start:0,  end:4,  title:'Fed Stage',      short:'Early fasting',      fuel:'Recent Meal',       organs:['stomach','liver'],       notes:'Insulin is beginning to fall. Your body is finishing the last phase of digestion.' },
  { id:2, start:4,  end:12, title:'Early Fasting',  short:'Glycogen-supported', fuel:'Liver Glycogen',    organs:['liver'],                  notes:'Blood glucose is being supported mainly by liver glycogen.' },
  { id:3, start:12, end:18, title:'Fuel Transition',short:'Fat Mobilization',   fuel:'Glycogen + Fat',   organs:['liver','fat','brain'],     notes:'The body starts easing away from immediate glucose dependence. Fat mobilization begins to rise.' },
  { id:4, start:18, end:24, title:'Ketosis Entry',  short:'Early Ketosis',      fuel:'Fat + Ketones',    organs:['fat','liver','brain'],     notes:'Ketone production begins to increase. Appetite starts feeling less urgent. GH rising.' },
  { id:5, start:24, end:48, title:'Deep Ketosis',   short:'Fat Adapted',        fuel:'Fat Stores',       organs:['fat','brain','heart'],     notes:'Fat-derived fuel is doing more of the work. Autophagy processes active.' },
  { id:6, start:48, end:72, title:'Extended Fast',  short:'Cellular Cleanup',   fuel:'Internal Reserves',organs:['brain','heart','fat'],     notes:'Cellular cleanup (Autophagy) processes are pronounced.' }
];

const ACTIVITIES = [
  { emoji: "🚶", label: "Walk",       multiplier: 2   },
  { emoji: "🏃", label: "Run",        multiplier: 3   },
  { emoji: "🏓", label: "Pickleball", multiplier: 2.5 },
  { emoji: "🏋️", label: "Lift",       multiplier: 2.5 },
];

type Badge = { id: string; emoji: string; name: string; desc: string; threshold: number; type: 'hours'|'streak'|'mp'|'activity' };
const BADGES: Badge[] = [
  { id: 'ketosis',   emoji: '🔥', name: 'Ketosis Club',       desc: 'Complete an 18h fast',       threshold: 18,  type: 'hours'    },
  { id: 'autophagy', emoji: '🧬', name: 'Autophagy Unlocked', desc: 'Complete a 24h fast',        threshold: 24,  type: 'hours'    },
  { id: 'marathon',  emoji: '🏆', name: 'Marathon Fast',      desc: 'Complete a 48h fast',        threshold: 48,  type: 'hours'    },
  { id: 'streak3',   emoji: '⚡', name: 'On a Roll',          desc: '3-day fasting streak',       threshold: 3,   type: 'streak'   },
  { id: 'streak7',   emoji: '📅', name: 'Iron Will',          desc: '7-day fasting streak',       threshold: 7,   type: 'streak'   },
  { id: 'streak30',  emoji: '💎', name: 'Diamond Mind',       desc: '30-day fasting streak',      threshold: 30,  type: 'streak'   },
  { id: 'century',   emoji: '💯', name: 'Century',            desc: 'Earn 100 Mind Points',       threshold: 100, type: 'mp'       },
  { id: 'mover',     emoji: '🏅', name: 'Mover',              desc: 'Log 5 activity sessions',    threshold: 5,   type: 'activity' },
];

const GOAL_OPTIONS = [14, 16, 18, 20, 24, 36, 48];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [mp, setMp] = useState(0);
  const [totalMpEver, setTotalMpEver] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxHoursEver, setMaxHoursEver] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [accelerantMinutes, setAccelerantMinutes] = useState(0);
  const [goalHours, setGoalHours] = useState(18);
  const [badgesEarned, setBadgesEarned] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<{emoji:string;label:string;minutes:number;bonusH:number;ts:string}[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [electrolyteCount, setElectrolyteCount] = useState(0);

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[0] | null>(null);
  const [activityMinutes, setActivityMinutes] = useState(30);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState<Badge | null>(null);
  const goalReachedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const realH = Math.max(0, (new Date().getTime() - startTime.getTime()) / 36e5);
      setElapsed(realH);
    }, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Goal completion detection
  useEffect(() => {
    const currentH = elapsed + bonus;
    if (currentH >= goalHours && !goalReachedRef.current && elapsed > 0) {
      goalReachedRef.current = true;
      setShowGoalCelebration(true);
      // Update max hours and check for new badges
      if (currentH > maxHoursEver) {
        const newMax = currentH;
        setMaxHoursEver(newMax);
        checkAndAwardBadges(newMax, streak, totalMpEver, activityCount, badgesEarned);
        if (session) supabase.from('profiles').update({ max_hours_ever: newMax }).eq('id', session.user.id);
      }
    }
    if (currentH < goalHours) goalReachedRef.current = false;
  }, [elapsed, bonus, goalHours]);

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setMp(data.mind_points || 0);
      setStreak(data.streak || 0);
      setGoalHours(data.fast_goal_hours || 18);
      setMaxHoursEver(data.max_hours_ever || 0);
      setTotalMpEver(data.total_mp_ever || 0);
      setActivityCount(data.activity_count || 0);
      const earned = data.badges_earned ? JSON.parse(data.badges_earned) : [];
      setBadgesEarned(earned);
      const accMin = data.accelerant_minutes || 0;
      setBonus(accMin / 60);
      setAccelerantMinutes(accMin);
      if (data.activity_log) {
        try { setActivityLog(JSON.parse(data.activity_log)); } catch {}
      }
      setWaterCount(data.water_count || 0);
      setElectrolyteCount(data.electrolyte_count || 0);
      if (data.fast_start_time) {
        const st = new Date(data.fast_start_time);
        setStartTime(st);
        const realH = Math.max(0, (new Date().getTime() - st.getTime()) / 36e5);
        setElapsed(realH);
        if (realH >= (data.fast_goal_hours || 18)) goalReachedRef.current = true;
      }
    }
  };

  const checkAndAwardBadges = (maxH: number, str: number, totalMp: number, actCount: number, currentBadges: string[]) => {
    const newBadges = [...currentBadges];
    let awarded: Badge | null = null;
    for (const badge of BADGES) {
      if (newBadges.includes(badge.id)) continue;
      const earned =
        (badge.type === 'hours'    && maxH    >= badge.threshold) ||
        (badge.type === 'streak'   && str     >= badge.threshold) ||
        (badge.type === 'mp'       && totalMp >= badge.threshold) ||
        (badge.type === 'activity' && actCount >= badge.threshold);
      if (earned) { newBadges.push(badge.id); awarded = badge; }
    }
    if (newBadges.length !== currentBadges.length) {
      setBadgesEarned(newBadges);
      if (awarded) setShowBadgeCelebration(awarded);
      if (session) supabase.from('profiles').update({ badges_earned: JSON.stringify(newBadges) }).eq('id', session!.user.id);
    }
    return newBadges;
  };

  const handleAuth = async () => {
    const email = prompt("Enter your email:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message);
    else alert("Check your email for the magic login link!");
  };

  const importLegacyData = async () => {
    const code = prompt("Paste your Gazelam Sync Code:");
    if (!code) return;
    try {
      const payload = JSON.parse(code.replace("GAZELAM_SYNC_PAYLOAD:", ""));
      if (!session) { alert("Please sign in first."); return; }
      const updates = {
        mind_points: payload.fastData?.mindPoints || 0,
        fast_start_time: payload.start || null,
        accelerant_minutes: payload.fastData?.accelerantMinutes || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (error) alert("Sync error: " + error.message);
      else { alert("Import Successful! Reloading..."); fetchUserData(session.user.id); }
    } catch { alert("Invalid Sync Code."); }
  };

  const openStartPicker = () => {
    const now = new Date();
    setPickerValue(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setShowStartPicker(true);
  };

  const confirmStartFast = async () => {
    if (!pickerValue) return;
    const chosen = new Date(pickerValue);
    setStartTime(chosen);
    const realH = Math.max(0, (new Date().getTime() - chosen.getTime()) / 36e5);
    setElapsed(realH);
    setBonus(0);
    setAccelerantMinutes(0);
    setActivityLog([]);
    setWaterCount(0);
    setElectrolyteCount(0);
    goalReachedRef.current = realH >= goalHours;
    setShowStartPicker(false);
    if (session) {
      await supabase.from('profiles').update({
        fast_start_time: chosen.toISOString(),
        accelerant_minutes: 0,
        activity_log: '[]',
        water_count: 0,
        electrolyte_count: 0,
      }).eq('id', session.user.id);
    }
  };

  const openActivity = (act: typeof ACTIVITIES[0]) => {
    setSelectedActivity(act);
    setActivityMinutes(30);
    setShowActivityModal(true);
  };

  const confirmActivity = async () => {
    if (!selectedActivity) return;
    const accelMin = activityMinutes * selectedActivity.multiplier;
    const accelH = accelMin / 60;
    const newBonus = bonus + accelH;
    const newAccelTotal = accelerantMinutes + Math.round(accelMin);
    const newActCount = activityCount + 1;
    const entry = { emoji: selectedActivity.emoji, label: selectedActivity.label, minutes: activityMinutes, bonusH: accelH, ts: new Date().toISOString() };
    const newLog = [entry, ...activityLog];
    setBonus(newBonus);
    setAccelerantMinutes(newAccelTotal);
    setActivityLog(newLog);
    setActivityCount(newActCount);
    setShowActivityModal(false);
    triggerScan();
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, totalMpEver, newActCount, badgesEarned);
    if (session) {
      await supabase.from('profiles').update({
        accelerant_minutes: newAccelTotal,
        activity_log: JSON.stringify(newLog),
        activity_count: newActCount,
        badges_earned: JSON.stringify(newBadges),
      }).eq('id', session.user.id);
    }
  };

  const logWater = async () => {
    const newCount = waterCount + 1;
    setWaterCount(newCount);
    if (session) await supabase.from('profiles').update({ water_count: newCount }).eq('id', session.user.id);
  };

  const logElectrolyte = async () => {
    const newCount = electrolyteCount + 1;
    setElectrolyteCount(newCount);
    if (session) await supabase.from('profiles').update({ electrolyte_count: newCount }).eq('id', session.user.id);
  };

  const triggerScan = () => {
    setShowScanner(true);
    setTimeout(() => setShowScanner(false), 2000);
  };

  // Streak multiplier: 1x base, +0.1x per day, max 3x
  const streakMultiplier = Math.min(3, 1 + streak * 0.1);

  const addMp = async (base: number) => {
    const points = Math.round(base * streakMultiplier);
    const newMp = mp + points;
    const newTotal = totalMpEver + points;
    setMp(newMp);
    setTotalMpEver(newTotal);
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, newTotal, activityCount, badgesEarned);
    if (session) {
      await supabase.from('profiles').update({
        mind_points: newMp,
        total_mp_ever: newTotal,
        badges_earned: JSON.stringify(newBadges),
      }).eq('id', session.user.id);
    }
  };

  if (!mounted) return null;

  const currentH = elapsed + bonus;
  const currentPhase = PHASES.find(p => currentH >= p.start && currentH < p.end) || PHASES[PHASES.length - 1];
  const goalProgress = Math.min(100, (currentH / goalHours) * 100);

  const fatPct = Math.min(95, Math.round(
    currentH <= 4  ? 0 :
    currentH <= 12 ? ((currentH - 4) / 8) * 15 :
    currentH <= 18 ? 15 + ((currentH - 12) / 6) * 20 :
    currentH <= 24 ? 35 + ((currentH - 18) / 6) * 25 :
    currentH <= 48 ? 60 + ((currentH - 24) / 24) * 25 :
    85 + ((currentH - 48) / 24) * 10
  ));
  const glycogenPct = 100 - fatPct;

  return (
    <div className="min-h-screen text-[#f4f7fb]">

      {/* GOAL CELEBRATION MODAL */}
      <AnimatePresence>
        {showGoalCelebration && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGoalCelebration(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-yellow-500/50 rounded-[2.5rem] p-10 z-[201] shadow-2xl text-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 3, duration: 0.5 }} className="text-6xl mb-4">🏆</motion.div>
              <h2 className="text-3xl font-black text-yellow-400 mb-2 tracking-tighter">GOAL REACHED!</h2>
              <p className="text-[#98a4bb] mb-2">You hit your <span className="text-white font-bold">{goalHours}h</span> fasting target!</p>
              <p className="text-cyan-400 font-bold text-sm mb-8">Day {streak} streak 🔥</p>
              <button onClick={() => setShowGoalCelebration(false)}
                className="w-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl text-lg">
                LET'S GO! 💪
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BADGE EARNED MODAL */}
      <AnimatePresence>
        {showBadgeCelebration && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBadgeCelebration(null)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-purple-500/50 rounded-[2.5rem] p-10 z-[201] shadow-2xl text-center">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }} className="text-6xl mb-4">{showBadgeCelebration.emoji}</motion.div>
              <div className="text-xs font-black text-purple-400 tracking-widest uppercase mb-2">Badge Unlocked!</div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">{showBadgeCelebration.name}</h2>
              <p className="text-[#98a4bb] mb-8">{showBadgeCelebration.desc}</p>
              <button onClick={() => setShowBadgeCelebration(null)}
                className="w-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-black py-4 rounded-2xl">
                NICE! 🎉
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ACTIVITY MODAL */}
      <AnimatePresence>
        {showActivityModal && selectedActivity && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowActivityModal(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-cyan-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <div className="text-4xl mb-3">{selectedActivity.emoji}</div>
              <h2 className="text-2xl font-black text-white mb-1 tracking-tighter">Log {selectedActivity.label}</h2>
              <p className="text-[#98a4bb] text-sm mb-6">{selectedActivity.multiplier}x multiplier — {selectedActivity.multiplier} min fasting per 1 min of activity.</p>
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#98a4bb] mb-2 block">Duration (minutes)</label>
              <input type="number" min={1} max={300} value={activityMinutes}
                onChange={e => setActivityMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-black/40 border border-white/10 text-white text-2xl font-black rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 text-center mb-2" />
              <div className="text-center text-cyan-400 font-bold text-sm mb-4">
                = +{(activityMinutes * selectedActivity.multiplier / 60).toFixed(2)}h fasting bonus
              </div>
              <div className="flex gap-2 mb-6">
                {[15, 30, 45, 60].map(m => (
                  <button key={m} onClick={() => setActivityMinutes(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${activityMinutes === m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-[#98a4bb]'}`}>
                    {m}m
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowActivityModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl transition-all">CANCEL</button>
                <button onClick={confirmActivity}
                  className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">LOG IT</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* START FAST PICKER */}
      <AnimatePresence>
        {showStartPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowStartPicker(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-cyan-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">When did you start?</h2>
              <p className="text-[#98a4bb] text-sm mb-6">Set the actual time your fast began — even if you forgot to log it.</p>
              <input type="datetime-local" value={pickerValue} onChange={e => setPickerValue(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-4 py-3 mb-6 focus:outline-none focus:border-cyan-500/50 text-sm" />
              <div className="flex gap-3">
                <button onClick={() => setShowStartPicker(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl transition-all">CANCEL</button>
                <button onClick={confirmStartFast}
                  className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black py-4 rounded-2xl">START FAST</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PHASE DETAIL MODAL */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPhase(null)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-[#0f131c] border-2 border-purple-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <h2 className="text-3xl font-black text-purple-400 mb-2 tracking-tighter uppercase">{selectedPhase.title}</h2>
              <div className="text-xs font-bold text-cyan-400 mb-6 tracking-widest uppercase">Biology: {selectedPhase.short}</div>
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden mb-6 aspect-video flex items-center justify-center relative">
                <img src={`/images/stage${selectedPhase.id}.png`} alt={selectedPhase.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f131c] via-transparent to-transparent" />
              </div>
              <div className="space-y-4 text-sm text-[#98a4bb] leading-relaxed">
                <p><strong className="text-white">Science:</strong> {selectedPhase.notes}</p>
                <p><strong className="text-white">Primary Fuel:</strong> {selectedPhase.fuel}</p>
              </div>
              <button onClick={() => setSelectedPhase(null)}
                className="w-full mt-8 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-100 font-bold py-4 rounded-2xl transition-all">GOT IT</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-6xl md:text-7xl font-[900] tracking-tighter text-white uppercase italic">FALLOW</h1>
          <p className="text-[#98a4bb] font-medium mt-3 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 shrink-0 rounded-full bg-cyan-500 animate-pulse" />
            {session ? (
              <span className="truncate">Active: <span className="text-cyan-400 font-bold">{session.user.email}</span></span>
            ) : "Metabolic Renewal Engine v1.0"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {session ? (
            <>
              <button onClick={importLegacyData}
                className="bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-4 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 text-xs text-[#98a4bb]">
                <History className="w-4 h-4" /> IMPORT
              </button>
              <button onClick={() => supabase.auth.signOut()}
                className="bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-4 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 text-xs text-red-400">
                <LogOut className="w-4 h-4" /> SIGN OUT
              </button>
            </>
          ) : (
            <button onClick={handleAuth}
              className="bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 text-white">
              <LogIn className="w-5 h-5 text-cyan-400" /> {loading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
            </button>
          )}
          <button onClick={openStartPicker}
            className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight uppercase">
            START FAST
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">

          {/* TIMER CARD */}
          <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Live Fasting State
            </h2>
            <div className="mb-4">
              <div className="text-6xl font-black tracking-tighter text-white flex items-baseline gap-2">
                {currentH.toFixed(1)}<span className="text-2xl text-[#4b5563]">h</span>
              </div>
              <div className="text-cyan-400 font-bold text-sm tracking-tight mt-1 uppercase">{currentPhase.short}</div>
            </div>

            {/* GOAL PROGRESS BAR */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563]">Goal Progress</span>
                <button onClick={() => setShowGoalPicker(true)}
                  className="text-[0.6rem] font-black text-cyan-500 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  <Target className="w-3 h-3" /> {goalHours}h
                </button>
              </div>
              <div className="h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${goalProgress >= 100 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                />
              </div>
              <div className="text-right text-[0.6rem] text-[#4b5563] mt-1 font-bold">
                {goalProgress >= 100 ? '✓ COMPLETE' : `${goalProgress.toFixed(0)}%`}
              </div>
            </div>

            {/* GOAL PICKER INLINE */}
            <AnimatePresence>
              {showGoalPicker && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden">
                  <div className="text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563] mb-2">Set Goal</div>
                  <div className="grid grid-cols-4 gap-1">
                    {GOAL_OPTIONS.map(h => (
                      <button key={h} onClick={() => { setGoalHours(h); setShowGoalPicker(false); goalReachedRef.current = currentH >= h;
                        if (session) supabase.from('profiles').update({ fast_goal_hours: h }).eq('id', session.user.id); }}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${goalHours === h ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-[#98a4bb]'}`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[0.65rem] text-[#98a4bb] font-bold uppercase tracking-wider">
              Bonus: <span className="text-cyan-400">+{bonus.toFixed(1)}h</span>
            </div>

            {/* FUEL MIX */}
            <div className="mt-6 space-y-3">
              <h2 className="text-[0.65rem] uppercase tracking-widest text-[#98a4bb] font-black">Est. Fuel Mix</h2>
              <div className="h-10 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex p-1">
                <motion.div animate={{ width: `${glycogenPct}%` }} transition={{ duration: 1, ease: "easeInOut" }}
                  className="h-full bg-blue-500/40 rounded-xl border border-blue-400/20" />
                {fatPct > 0 && (
                  <motion.div animate={{ width: `${fatPct}%` }} transition={{ duration: 1, ease: "easeInOut" }}
                    className="h-full bg-purple-500/40 rounded-xl border border-purple-400/20 ml-1" />
                )}
              </div>
              <div className="flex justify-between text-[0.6rem] font-black uppercase tracking-tighter">
                <span className="text-blue-400">Glycogen: {glycogenPct}%</span>
                <span className="text-purple-400">Fat/Ketones: {fatPct}%</span>
              </div>
            </div>
          </section>

          {/* MIND POINTS CARD */}
          <section className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-5xl font-black text-purple-400 mb-1 leading-none">{mp}</div>
                <div className="text-[0.65rem] bg-purple-500/20 px-3 py-1 rounded-full text-purple-200 font-black tracking-widest uppercase inline-block">Mind Points</div>
              </div>
              <div className="text-right">
                {streak > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[0.7rem] font-black text-orange-400 flex items-center gap-1">
                      <Flame className="w-4 h-4" fill="currentColor" /> {streak} DAY STREAK
                    </div>
                    {streak >= 2 && (
                      <div className="text-[0.6rem] text-yellow-400 font-bold">{streakMultiplier.toFixed(1)}x multiplier</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => addMp(10)} className="group flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border border-purple-500/10 hover:border-purple-500/40 p-4 rounded-3xl transition-all text-center">
                <Brain className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">No Late Snack</span>
              </button>
              <button onClick={() => addMp(20)} className="group flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border border-cyan-500/20 hover:border-cyan-500/40 p-4 rounded-3xl transition-all text-center">
                <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">Walk vs Lunch</span>
              </button>
              <button onClick={() => addMp(15)} className="group flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border border-purple-500/10 hover:border-purple-500/40 p-4 rounded-3xl transition-all text-center">
                <PlusCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">Refused Treat</span>
              </button>
              <button onClick={() => addMp(5)} className="group flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border border-purple-500/10 hover:border-purple-500/40 p-4 rounded-3xl transition-all text-center">
                <Droplets className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">AM/PM Discipline</span>
              </button>
            </div>
          </section>

          {/* HYDRATION */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4 flex items-center gap-2">
              💧 Hydration
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* WATER */}
              <div className="bg-black/30 border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="text-2xl">💧</div>
                <div className="text-3xl font-black text-cyan-400">{waterCount}</div>
                <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">glasses</div>
                <button onClick={logWater}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-black py-2 rounded-xl text-xs transition-all">
                  + Water
                </button>
              </div>
              {/* ELECTROLYTES */}
              <div className="bg-black/30 border border-orange-500/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="text-2xl">⚡</div>
                <div className="text-3xl font-black text-orange-400">{electrolyteCount}</div>
                <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">servings</div>
                <button onClick={logElectrolyte}
                  className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-black py-2 rounded-xl text-xs transition-all">
                  + Electrolytes
                </button>
              </div>
            </div>
            {/* Water goal indicator */}
            <div className="mt-3">
              <div className="flex justify-between text-[0.55rem] font-black uppercase text-[#4b5563] mb-1">
                <span>Daily Goal: 8 glasses</span>
                <span className={waterCount >= 8 ? 'text-cyan-400' : ''}>{waterCount >= 8 ? '✓ DONE' : `${8 - waterCount} to go`}</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${Math.min(100, (waterCount / 8) * 100)}%` }} transition={{ duration: 0.5 }}
                  className="h-full bg-cyan-500 rounded-full" />
              </div>
            </div>
          </section>

          {/* ACCELERANTS */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4">Accelerants</h2>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map(act => (
                <button key={act.label} onClick={() => openActivity(act)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#98a4bb] hover:text-white">
                  {act.emoji} {act.label.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* ACTIVITY LOG */}
          {activityLog.length > 0 && (
            <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
              <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3 text-cyan-500" /> Activity Log
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {activityLog.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{entry.emoji}</span>
                      <div>
                        <div className="text-[0.65rem] font-black text-white">{entry.label} — {entry.minutes}min</div>
                        <div className="text-[0.6rem] text-[#4b5563]">
                          {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className="text-cyan-400 font-black text-xs">+{entry.bonusH.toFixed(2)}h</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* CENTER COLUMN: METABOLIC MAP */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 flex flex-col items-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
            <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-[#98a4bb] font-black mb-10 self-start z-10">
              Metabolic Anatomy <span className="text-cyan-500 ml-2">LIVE</span>
            </h2>
            <div className="relative w-full max-w-[400px] flex justify-center py-10 z-10">
              <img src="/body.png" alt="Anatomy" className="w-full opacity-80 mix-blend-lighten" />
              <AnimatePresence>
                {showScanner && (
                  <motion.div initial={{ top: "0%" }} animate={{ top: "100%" }} exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20" />
                )}
              </AnimatePresence>
              <div className={`absolute top-[13%] left-1/2 -translate-x-1/2 w-10 h-6 bg-purple-500/40 blur-lg rounded-full transition-opacity duration-1000 ${currentH > 18 ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute top-[31%] left-[56%] -translate-x-1/2 w-12 h-8 bg-cyan-400/40 blur-xl rounded-full transition-opacity duration-1000 ${currentH < 12 ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <div className="mt-auto w-full pt-10 flex flex-wrap gap-2 justify-center z-10">
              {[12, 24, 48, 72].map(m => (
                <div key={m} className={`px-4 py-2 rounded-full text-[0.6rem] font-black tracking-widest border transition-all ${currentH >= m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/20 border-white/5 text-[#4b5563]'}`}>
                  {m}H {currentH >= m ? '✓' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* BADGES */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black mb-6 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Badge Collection
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {BADGES.map(badge => {
                const earned = badgesEarned.includes(badge.id);
                return (
                  <div key={badge.id} title={`${badge.name}: ${badge.desc}`}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all cursor-default ${earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/20 border-white/5 opacity-30'}`}>
                    <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{badge.emoji}</span>
                    <span className={`text-[0.5rem] font-black text-center leading-tight ${earned ? 'text-yellow-300' : 'text-[#4b5563]'}`}>{badge.name}</span>
                  </div>
                );
              })}
            </div>
            {badgesEarned.length === 0 && (
              <p className="text-center text-[0.65rem] text-[#4b5563] mt-4">Complete your first {goalHours}h fast to unlock your first badge.</p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: ROADMAP */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black">72h Metabolic Roadmap</h2>
              <Clock className="w-4 h-4 text-cyan-500/50" />
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {PHASES.map(p => (
                <motion.div key={p.id} whileHover={{ x: 5 }} onClick={() => setSelectedPhase(p)}
                  className={`group p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${currentH >= p.start && currentH < p.end ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}>
                  {currentH >= p.end && (
                    <div className="absolute top-2 right-2"><CheckCircle2 className="w-3 h-3 text-cyan-400" /></div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-md ${currentH >= p.start && currentH < p.end ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-[#4b5563]'}`}>{p.start}-{p.end}H</span>
                    <Info className="w-3 h-3 text-[#4b5563] group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className={`text-base font-bold mb-2 tracking-tight ${currentH >= p.start && currentH < p.end ? 'text-white' : 'text-[#98a4bb]'}`}>{p.title}</h3>
                  <p className="text-[0.7rem] text-[#6b7280] leading-snug line-clamp-2">{p.notes}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[0.65rem] font-black text-[#4b5563] uppercase tracking-widest">Next Milestone</span>
                <span className="text-xs font-black text-orange-400">
                  {currentH < 12 ? `Fuel Shift @ 12h` : currentH < 18 ? `Ketosis @ 18h` : currentH < 24 ? `Deep Ketosis @ 24h` : currentH < 48 ? `Autophagy @ 48h` : 'Extended Fast'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
