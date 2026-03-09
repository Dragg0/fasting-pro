"use client";

import { useEffect, useState } from "react";
import { 
  Brain, FlaskConical, History, LogIn, TrendingUp,
  Map as MapIcon, PlusCircle, CheckCircle2, Flame,
  Zap, Droplets, Info, Clock, LogOut, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// Types
type Phase = {
  id: number;
  start: number;
  end: number;
  title: string;
  short: string;
  fuel: string;
  organs: string[];
  notes: string;
};

const PHASES: Phase[] = [
  { id:1, start:0, end:4, title:'Fed Stage', short:'Early fasting', fuel:'Recent Meal', organs:['stomach','liver'], notes:'Insulin is beginning to fall. Your body is finishing the last phase of digestion.' },
  { id:2, start:4, end:12, title:'Early Fasting', short:'Glycogen-supported', fuel:'Liver Glycogen', organs:['liver'], notes:'Blood glucose is being supported mainly by liver glycogen.' },
  { id:3, start:12, end:18, title:'Fuel transition', short:'Fat Mobilization', fuel:'Glycogen + Fat', organs:['liver','fat','brain'], notes:'The body starts easing away from immediate glucose dependence. Fat mobilization begins to rise.' },
  { id:4, start:18, end:24, title:'Ketosis Entry', short:'Early Ketosis', fuel:'Fat + Ketones', organs:['fat','liver','brain'], notes:'Ketone production begins to increase. Appetite starts feeling less urgent. GH rising.' },
  { id:5, start:24, end:48, title:'Deep Ketosis', short:'Fat Adapted', fuel:'Fat Stores', organs:['fat','brain','heart'], notes:'Fat-derived fuel is doing more of the work. Autophagy processes active.' },
  { id:6, start:48, end:72, title:'Extended fast', short:'Cellular Cleanup', fuel:'Internal Reserves', organs:['brain','heart','fat'], notes:'Cellular cleanup (Autophagy) processes are pronounced.' }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [mp, setMp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [accelerantMinutes, setAccelerantMinutes] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check active session
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

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setMp(data.mind_points || 0);
      setStreak(data.streak || 0);
      if (data.fast_start_time) setStartTime(new Date(data.fast_start_time));
      if (data.accelerant_minutes) setBonus(data.accelerant_minutes / 60);
    }
  };

  const handleAuth = async () => {
    const email = prompt("Enter your email for the 'Second Brain' login:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) alert(error.message);
    else alert("Check your email for the magic login link!");
  };

  const importLegacyData = async () => {
    const code = prompt("Paste your Gazelam Sync Code here (from the old app):");
    if (!code) return;
    
    try {
      const jsonStr = code.replace("GAZELAM_SYNC_PAYLOAD:", "");
      const payload = JSON.parse(jsonStr);
      
      if (!session) {
        alert("Please sign in first to import data to your account.");
        return;
      }

      const updates = {
        mind_points: payload.fastData?.mindPoints || 0,
        fast_start_time: payload.start || null,
        accelerant_minutes: payload.fastData?.accelerantMinutes || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      
      if (error) {
        alert("Sync error: " + error.message);
      } else {
        alert("Import Successful! Reloading...");
        fetchUserData(session.user.id);
      }
    } catch (e) {
      alert("Invalid Sync Code. Make sure you copied the whole block.");
    }
  };

  const startFast = async () => {
    const now = new Date();
    setStartTime(now);
    setElapsed(0);
    setBonus(0);
    
    if (session) {
      await supabase.from('profiles').update({ 
        fast_start_time: now.toISOString(),
        accelerant_minutes: 0,
        mind_points: 0 // Optional: reset points or keep? Let's reset for new fast.
      }).eq('id', session.user.id);
    }
  };

  const triggerScan = () => {
    setShowScanner(true);
    setTimeout(() => setShowScanner(false), 2000);
  };

  const addMp = async (points: number) => {
    const newMp = mp + points;
    setMp(newMp);
    
    if (session) {
      await supabase.from('profiles').update({ mind_points: newMp }).eq('id', session.user.id);
    }
  };

  if (!mounted) return null;

  const currentH = elapsed + bonus;
  const currentPhase = PHASES.find(p => currentH >= p.start && currentH < p.end) || PHASES[PHASES.length-1];

  return (
    <div className="min-h-screen text-[#f4f7fb]">
      {/* OVERLAYS */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPhase(null)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-[#0f131c] border-2 border-purple-500/30 rounded-[2.5rem] p-8 z-[101] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
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

              <button 
                onClick={() => setSelectedPhase(null)}
                className="w-full mt-8 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-100 font-bold py-4 rounded-2xl transition-all"
              >
                GOT IT
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-6xl md:text-7xl font-[900] tracking-tighter text-white uppercase italic">FALLOW</h1>
          <p className="text-[#98a4bb] font-medium mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            {session ? `Connected: ${session.user.email}` : "Biological Renewal Engine v1.0"}
          </p>
        </div>
        <div className="flex gap-3">
          {session ? (
            <>
              <button 
                onClick={importLegacyData}
                className="flex-1 md:flex-none bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
              >
                <History className="w-4 h-4 text-[#98a4bb]" /> IMPORT
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="flex-1 md:flex-none bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5 text-[#98a4bb]" /> SIGN OUT
              </button>
            </>
          ) : (
            <button 
              onClick={handleAuth}
              className="flex-1 md:flex-none bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5 text-[#98a4bb]" /> {loading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
            </button>
          )}
          <button 
            onClick={startFast}
            className="flex-1 md:flex-none bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight"
          >
            START FAST
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: BIO DATA */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Live Fasting State
            </h2>
            
            <div className="mb-8">
              <div className="text-6xl font-black tracking-tighter text-white flex items-baseline gap-2">
                {currentH.toFixed(1)}<span className="text-2xl text-[#4b5563]">h</span>
              </div>
              <div className="text-cyan-400 font-bold text-sm tracking-tight mt-1 uppercase">{currentPhase.short}</div>
              <div className="text-[0.65rem] text-[#98a4bb] mt-4 font-bold uppercase tracking-wider">Bonus Progress: <span className="text-cyan-400">+{bonus.toFixed(1)}h</span></div>
            </div>

            <div className="space-y-4">
               <h2 className="text-[0.65rem] uppercase tracking-widest text-[#98a4bb] font-black">Est. Fuel Mix</h2>
               <div className="h-10 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex p-1">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "80%" }}
                    className="h-full bg-blue-500/40 rounded-xl border border-blue-400/20" 
                  />
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "20%" }}
                    className="h-full bg-purple-500/40 rounded-xl border border-purple-400/20 ml-1" 
                  />
               </div>
               <div className="flex justify-between text-[0.6rem] font-black uppercase tracking-tighter">
                 <span className="text-blue-400">Glycogen: 80%</span>
                 <span className="text-purple-400">Fat/Ketones: 20%</span>
               </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 shadow-xl">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <div className="text-5xl font-black text-purple-400 mb-1 leading-none">{mp}</div>
                   <div className="text-[0.65rem] bg-purple-500/20 px-3 py-1 rounded-full text-purple-200 font-black tracking-widest uppercase inline-block">Mind Points</div>
                </div>
                <div className="text-right">
                   <div className="text-[0.7rem] font-black text-purple-300 leading-tight">LEVEL 1<br/>NOVICE</div>
                   {streak > 0 && (
                     <div className="mt-2 text-[0.65rem] font-black text-orange-400 flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3" fill="currentColor" /> {streak} DAY STREAK
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

          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
             <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4">Accelerants</h2>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setBonus(prev => prev + 0.5); triggerScan(); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#98a4bb]">
                   🚶 WALK
                </button>
                <button onClick={() => { setBonus(prev => prev + 1.5); triggerScan(); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#98a4bb]">
                   🏓 PICKLEBALL
                </button>
             </div>
          </section>
        </div>

        {/* CENTER COLUMN: METABOLIC MAP */}
        <div className="lg:col-span-5 relative bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 flex flex-col items-center overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
           
           <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-[#98a4bb] font-black mb-10 self-start z-10">
             Metabolic Anatomy <span className="text-cyan-500 ml-2">LIVE</span>
           </h2>

           <div className="relative w-full max-w-[400px] flex justify-center py-10 z-10">
              <img src="/body.png" alt="Anatomy" className="w-full opacity-80 mix-blend-lighten" />
              
              {/* SCANNER */}
              <AnimatePresence>
                {showScanner && (
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20"
                  />
                )}
              </AnimatePresence>

              {/* GLOW ZONES - Sample Brain Glow */}
              <div className={`absolute top-[13%] left-1/2 -translate-x-1/2 w-10 h-6 bg-purple-500/40 blur-lg rounded-full transition-opacity duration-1000 ${currentH > 18 ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute top-[31%] left-[56%] -translate-x-1/2 w-12 h-8 bg-cyan-400/40 blur-xl rounded-full transition-opacity duration-1000 ${currentH < 12 ? 'opacity-100' : 'opacity-0'}`} />
           </div>

           {/* Milestone Badges */}
           <div className="mt-auto w-full pt-10 flex flex-wrap gap-2 justify-center z-10">
              {[12, 24, 48, 72].map(m => (
                <div key={m} className={`px-4 py-2 rounded-full text-[0.6rem] font-black tracking-widest border transition-all ${currentH >= m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/20 border-white/5 text-[#4b5563]'}`}>
                   {m}H {currentH >= m ? '✓' : ''}
                </div>
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN: TIMELINE */}
        <div className="lg:col-span-4 space-y-8 flex flex-col h-full">
           <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black">72h Metabolic Roadmap</h2>
                 <Clock className="w-4 h-4 text-cyan-500/50" />
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                 {PHASES.map(p => (
                   <motion.div 
                     key={p.id} 
                     whileHover={{ x: 5 }}
                     onClick={() => setSelectedPhase(p)}
                     className={`group p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${currentH >= p.start && currentH < p.end ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}
                   >
                     {currentH >= p.end && (
                       <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                       </div>
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
                    <span className="text-xs font-black text-orange-400">Autophagy @ 24h</span>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
