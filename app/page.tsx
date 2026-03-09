"use client";

import { useEffect, useState } from "react";
import { 
  Zap, Brain, Droplets, FlaskConical, Clock, 
  Map as MapIcon, History, LogIn, TrendingUp,
  CircleCheck, PlusCircle
} from "lucide-react";

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
  { id:1, start:0, end:4, title:'Fed Stage', short:'Early fasting', fuel:'Recent Meal', organs:['stomach','liver'], notes:'Insulin is beginning to fall. Your body is finishing the last phase of digestion and shifting toward internal fuel management.' },
  { id:2, start:4, end:12, title:'Early Fasting', short:'Glycogen-supported', fuel:'Liver Glycogen', organs:['liver'], notes:'Blood glucose is being supported mainly by liver glycogen. Hunger may come in waves.' },
  { id:3, start:12, end:18, title:'Fuel transition', short:'Fat Mobilization', fuel:'Glycogen + Fat', organs:['liver','fat','brain'], notes:'The body starts easing away from immediate glucose dependence. Fat mobilization begins to rise.' },
  { id:4, start:18, end:24, title:'Ketosis Entry', short:'Early Ketosis', fuel:'Fat + Ketones', organs:['fat','liver','brain'], notes:'Ketone production begins to increase. Appetite starts feeling less urgent. GH rising.' },
  { id:5, start:24, end:48, title:'Deep Ketosis', short:'Fat Adapted', fuel:'Fat Stores', organs:['fat','brain','heart'], notes:'Fat-derived fuel is doing more of the work. Ketones are available. Autophagy processes active.' },
  { id:6, start:48, end:72, title:'Extended fast', short:'Cellular Cleanup', fuel:'Internal Reserves', organs:['brain','heart','fat'], notes:'Cellular cleanup (Autophagy) processes are pronounced.' }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [h, setH] = useState(0);
  const [mp, setMp] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Simulation of timer logic for skeleton
    const interval = setInterval(() => setH(prev => prev + 0.001), 3600);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {/* HEADER */}
      <header className="lg:col-span-3 flex justify-between items-end mb-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">FASTING MAP PRO</h1>
          <p className="text-[#98a4bb] text-sm md:text-base mt-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            Biological feedback engine v2.0
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1a2130] hover:bg-[#23293a] border border-white/10 p-3 rounded-2xl transition-all">
            <LogIn className="w-5 h-5" />
          </button>
          <button className="bg-gradient-to-b from-cyan-400/20 to-cyan-400/10 border border-cyan-400/30 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-cyan-500/10">
            START NOW
          </button>
        </div>
      </header>

      {/* COLUMN 1: BIO DATA */}
      <div className="space-y-6">
        <section className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-[0.7rem] uppercase tracking-widest text-[#98a4bb] font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Live State
          </h2>
          <div className="text-5xl font-black tracking-tighter mb-1">0.0h</div>
          <div className="text-cyan-400 font-bold text-sm">Initializing...</div>
          
          <div className="mt-8 space-y-4">
            <h2 className="text-[0.7rem] uppercase tracking-widest text-[#98a4bb] font-bold">Est. Fuel Mix</h2>
            <div className="h-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex">
              <div className="w-full bg-blue-500/40 border-r border-white/10" />
              <div className="w-0 bg-purple-500/40" />
            </div>
            <div className="flex justify-between text-[0.7rem] font-bold uppercase">
              <span className="text-blue-400">Glycogen: 100%</span>
              <span className="text-purple-400">Ketones: 0%</span>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-3xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-4xl font-black text-purple-400 drop-shadow-lg">{mp}</div>
              <div className="text-[0.6rem] bg-purple-500/20 px-2 py-1 rounded-md text-purple-200 font-bold tracking-widest uppercase">Mind Points</div>
            </div>
            <div className="text-right text-[0.7rem] font-black text-purple-400">LEVEL 1<br/>NOVICE</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
             {['Late Snack', 'Treat', 'AM Snack', 'PM Snack'].map(label => (
               <button key={label} className="flex items-center gap-2 bg-black/40 border border-purple-500/10 hover:border-purple-500/40 p-3 rounded-2xl text-[0.65rem] font-bold text-[#f4f7fb] transition-all">
                 <Brain className="w-3 h-3 text-purple-400" /> {label}
               </button>
             ))}
          </div>
        </section>
      </div>

      {/* COLUMN 2: BODY MAP */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
        <h2 className="text-[0.7rem] uppercase tracking-widest text-[#98a4bb] font-bold mb-8 self-start flex items-center gap-2">
          <MapIcon className="w-3 h-3" /> Metabolic Map
        </h2>
        <div className="relative w-full max-w-[320px] aspect-[1/2] flex items-center justify-center">
           <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full" />
           <div className="text-center opacity-20">
             <MapIcon className="w-32 h-32 mx-auto" />
             <p className="text-[0.6rem] uppercase tracking-widest mt-4">Anatomical Viz Pending</p>
           </div>
        </div>
      </div>

      {/* COLUMN 3: TIMELINE */}
      <div className="space-y-6">
        <section className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col h-full max-h-[700px]">
          <h2 className="text-[0.7rem] uppercase tracking-widest text-[#98a4bb] font-bold mb-4 flex items-center gap-2">
            <History className="w-3 h-3" /> Timeline
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {PHASES.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 opacity-40 hover:opacity-100 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[0.65rem] font-bold text-cyan-400">{p.start}-{p.end}h</span>
                   <h3 className="text-sm font-bold">{p.title}</h3>
                </div>
                <p className="text-[0.7rem] text-[#98a4bb] leading-relaxed line-clamp-2">{p.notes}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
