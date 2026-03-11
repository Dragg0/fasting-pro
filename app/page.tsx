"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Brain, History, LogIn, TrendingUp, PlusCircle, CheckCircle2,
  Flame, Zap, Droplets, Info, Clock, LogOut, Loader2, Trophy, Target, Scale, UtensilsCrossed, ChevronDown,
  Footprints, Moon, ShieldCheck, Camera, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// ─── TOOLTIP ────────────────────────────────────────────────────────────────
// Pure CSS transitions — no Framer Motion, no stacking context traps
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isTouchUi, setIsTouchUi] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 288, arrowLeft: '50%' });

  useEffect(() => {
    const syncTouchUi = () => {
      // If screen is narrow (mobile/tablet), always use the modal UI
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;
      setIsTouchUi(isNarrow);
    };
    syncTouchUi();
    window.addEventListener('resize', syncTouchUi);
    return () => window.removeEventListener('resize', syncTouchUi);
  }, []);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pad = 12;
    const vw = window.innerWidth;
    const tooltipW = Math.min(288, vw - pad * 2);
    const center = rect.left + rect.width / 2;
    const halfW = tooltipW / 2;
    const clamped = Math.max(pad + halfW, Math.min(vw - pad - halfW, center));
    const arrowPx = center - (clamped - halfW);
    const arrowLeft = `${Math.max(16, Math.min(tooltipW - 16, arrowPx))}px`;
    setPos({ top: rect.top - 8, left: clamped, width: tooltipW, arrowLeft });
  };

  useEffect(() => {
    if (show && !isTouchUi) {
      updatePos();
      const dismiss = (e: MouseEvent | TouchEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setShow(false);
      };
      window.addEventListener('scroll', updatePos, true);
      window.addEventListener('resize', updatePos);
      document.addEventListener('touchstart', dismiss);
      document.addEventListener('mousedown', dismiss);
      return () => {
        window.removeEventListener('scroll', updatePos, true);
        window.removeEventListener('resize', updatePos);
        document.removeEventListener('touchstart', dismiss);
        document.removeEventListener('mousedown', dismiss);
      };
    }
  }, [show, isTouchUi]);

  return (
    <>
      <div ref={triggerRef} className="relative" onMouseEnter={() => !isTouchUi && setShow(true)} onMouseLeave={() => !isTouchUi && setShow(false)}
        onClick={() => setShow(s => !s)}>
        {children}
      </div>
      {show && createPortal(
        isTouchUi ? (
          <>
            <div className="fixed inset-0 z-[2147483646] bg-black/60 backdrop-blur-sm" onClick={() => setShow(false)} />
            <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[2147483647] flex justify-center">
              <div className="relative w-full max-w-sm rounded-3xl border border-cyan-500/25 bg-[#0c1018] p-5 shadow-2xl shadow-black/70 max-h-[75vh] overflow-y-auto">
                <button
                  onClick={() => setShow(false)}
                  className="absolute right-3 top-3 text-sm font-black text-[#98a4bb] hover:text-white"
                >
                  ✕
                </button>
                <div className="pr-6 text-sm text-[#c8d4e8] leading-relaxed break-words">{content}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 2147483647,
            pointerEvents: 'none',
          }}>
            <div className="relative bg-[#0c1018] border border-cyan-500/25 rounded-2xl p-4 shadow-2xl shadow-black/60">
              <div className="text-xs text-[#c8d4e8] leading-relaxed">{content}</div>
              <div className="absolute -bottom-1.5 w-3 h-3 bg-[#0c1018] border-r border-b border-cyan-500/25"
                style={{ left: pos.arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }} />
            </div>
          </div>
        ),
        document.body
      )}
    </>
  );
}

// ─── MP BUTTON (tap = award, long-press = info) ────────────────────────────
function MpButton({ children, onTap, tipContent, color = 'purple' }: { children: React.ReactNode; onTap: () => void; tipContent: React.ReactNode; color?: string }) {
  const [showTip, setShowTip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      setShowTip(true);
    }, 500);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!didLongPress.current) onTap();
  };

  return (
    <>
      <button
        onTouchStart={startPress} onTouchEnd={endPress} onTouchCancel={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
        onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
        className={`group w-full flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border ${color==='cyan'?'border-cyan-500/20 hover:border-cyan-500/40':'border-purple-500/10 hover:border-purple-500/40'} p-4 rounded-3xl transition-all text-center`}
      >
        {children}
      </button>
      {showTip && createPortal(
        <>
          <div className="fixed inset-0 z-[2147483646] bg-black/60 backdrop-blur-sm" onClick={() => setShowTip(false)} />
          <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[2147483647] flex justify-center">
            <div className="relative w-full max-w-sm rounded-3xl border border-cyan-500/25 bg-[#0c1018] p-5 shadow-2xl shadow-black/70">
              <button onClick={() => setShowTip(false)} className="absolute right-3 top-3 text-sm font-black text-[#98a4bb] hover:text-white">✕</button>
              <div className="pr-6 text-sm text-[#c8d4e8] leading-relaxed break-words">{tipContent}</div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ─── SPARKLINE ──────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 0.5;
  const W = 200, H = 50;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 6) - 3}`
  ).join(" ");
  const area = `M${pts.split(" ")[0]} L${pts} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <polyline points={pts} fill="none" stroke="rgb(34,211,238)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={(data.length - 1) / (data.length - 1) * W}
        cy={H - ((data[data.length - 1] - min) / range) * (H - 6) - 3}
        r="3" fill="rgb(34,211,238)" />
    </svg>
  );
}

// ─── CALENDAR ───────────────────────────────────────────────────────────────
function FastingCalendar({ history, activityLog, mpLog, waterLog, electrolyteLog }: {
  history: any[];
  activityLog: {emoji:string;label:string;minutes:number;bonusH:number;ts:string}[];
  mpLog: {label:string;points:number;time:string}[];
  waterLog: number; // today's count (we'll also derive from mpLog)
  electrolyteLog: number;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const fastMap = history.reduce((acc, f) => {
    const d = new Date(f.end).toLocaleDateString('en-CA');
    acc[d] = f;
    return acc;
  }, {} as any);

  const activityMap = activityLog.reduce((acc, a) => {
    const d = new Date(a.ts).toLocaleDateString('en-CA');
    if (!acc[d]) acc[d] = [];
    acc[d].push(a);
    return acc;
  }, {} as Record<string, typeof activityLog>);

  // Build sets of dates for each dot type from mpLog
  const hydrationDays = new Set<string>();
  const mpDays = new Set<string>();
  mpLog.forEach(entry => {
    const d = new Date(entry.time).toLocaleDateString('en-CA');
    if (entry.label === 'Water' || entry.label === 'Electrolytes') {
      hydrationDays.add(d);
    } else {
      mpDays.add(d);
    }
  });

  const getDots = (dateStr: string) => {
    const dots: { key: string; color: string }[] = [];
    if (fastMap[dateStr])              dots.push({ key: 'fast',      color: 'bg-green-400' });
    if (hydrationDays.has(dateStr))    dots.push({ key: 'hydration', color: 'bg-cyan-400' });
    if (activityMap[dateStr]?.length)   dots.push({ key: 'accel',    color: 'bg-orange-400' });
    if (mpDays.has(dateStr))           dots.push({ key: 'mp',        color: 'bg-purple-400' });
    return dots;
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.65rem] font-black uppercase text-white tracking-widest">
          {viewDate.toLocaleString('default', { month: 'long' })} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-white/5 rounded-lg text-[#4b5563] hover:text-white">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-white/5 rounded-lg text-[#4b5563] hover:text-white">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} className="text-[0.5rem] font-black text-[#4b5563]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(b => <div key={`b-${b}`} />)}
        {days.map(d => {
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const fast = fastMap[dateStr];
          const activityDots = getDots(dateStr);
          const dayActivities = activityMap[dateStr] || [];
          const dayMpEntries = mpLog.filter(e => new Date(e.time).toLocaleDateString('en-CA') === dateStr && e.label !== 'Water' && e.label !== 'Electrolytes');
          const dayHydration = mpLog.filter(e => new Date(e.time).toLocaleDateString('en-CA') === dateStr && (e.label === 'Water' || e.label === 'Electrolytes'));
          const hasAnything = fast || dayActivities.length || dayMpEntries.length || dayHydration.length;
          return (
            <Tooltip key={d} content={hasAnything ? (
              <div>
                {fast && (
                  <>
                    <div className="font-black text-white mb-1">{fast.hours}h Fast</div>
                    <div className="text-[0.6rem] text-cyan-400 font-bold mb-2">Logged {new Date(fast.end).toLocaleTimeString()}</div>
                    {fast.refeed?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {fast.refeed.map((f:any, i:number) => <span key={i} className="text-[0.5rem] bg-white/5 px-1.5 py-0.5 rounded-full">{f.emoji} {f.label}</span>)}
                      </div>
                    )}
                  </>
                )}
                {dayActivities.length > 0 && (
                  <div className="mb-2">
                    <div className="font-black text-orange-400 mb-1 text-[0.7rem] uppercase tracking-wide">Accelerants</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayActivities.map((a, i) => (
                        <span key={i} className="text-[0.5rem] bg-white/5 px-1.5 py-0.5 rounded-full">{a.emoji} {a.label} · {a.minutes}m</span>
                      ))}
                    </div>
                  </div>
                )}
                {dayHydration.length > 0 && (
                  <div className="mb-2">
                    <div className="font-black text-cyan-400 mb-1 text-[0.7rem] uppercase tracking-wide">Hydration</div>
                    <div className="text-[0.55rem] text-[#98a4bb]">
                      {dayHydration.filter(e => e.label === 'Water').length > 0 && <span>💧 {dayHydration.filter(e => e.label === 'Water').length} water </span>}
                      {dayHydration.filter(e => e.label === 'Electrolytes').length > 0 && <span>⚡ {dayHydration.filter(e => e.label === 'Electrolytes').length} electrolytes</span>}
                    </div>
                  </div>
                )}
                {dayMpEntries.length > 0 && (
                  <div>
                    <div className="font-black text-purple-400 mb-1 text-[0.7rem] uppercase tracking-wide">Mind Points</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayMpEntries.map((e, i) => (
                        <span key={i} className="text-[0.5rem] bg-white/5 px-1.5 py-0.5 rounded-full">🧠 {e.label} +{e.points}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[0.65rem] text-[#98a4bb]">No activity logged</div>
            )}>
              <div className={`aspect-square flex flex-col items-center justify-center text-[0.65rem] font-bold rounded-lg border transition-all ${
                fast ? (
                  fast.hours >= 24 ? 'bg-purple-500/20 border-purple-500/40 text-purple-200' :
                  fast.hours >= 18 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200' :
                  'bg-green-500/20 border-green-500/40 text-green-200'
                ) : 'bg-black/20 border-transparent text-[#4b5563]'
              }`}>
                <span>{d}</span>
                {activityDots.length > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    {activityDots.map(dot => (
                      <span key={dot.key} className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                    ))}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
        {[
          { color: 'bg-green-400', label: 'Fast' },
          { color: 'bg-cyan-400', label: 'Hydration' },
          { color: 'bg-orange-400', label: 'Accelerant' },
          { color: 'bg-purple-400', label: 'Mind Pts' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
            <span className="text-[0.5rem] font-bold text-[#4b5563]">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────
type Phase = { id: number; start: number; end: number; title: string; short: string; fuel: string; organs: string[]; notes: string; science: string; };

const PHASES: Phase[] = [
  { id:1, start:0,  end:4,  title:'Fed Stage',       short:'Early fasting',      fuel:'Recent Meal',       organs:['stomach','liver'],
    notes:'Insulin is beginning to fall. Your body is finishing the last phase of digestion.',
    science:'Insulin peaks 30-60min after eating and suppresses fat burning completely. As it falls below ~25 mU/L, fat oxidation can begin. This window is still "fed" — glucagon hasn\'t yet dominated.' },
  { id:2, start:4,  end:12, title:'Early Fasting',   short:'Glycogen-supported', fuel:'Liver Glycogen',    organs:['liver'],
    notes:'Blood glucose is being supported mainly by liver glycogen.',
    science:'Your liver holds ~100g glycogen (~400 kcal). Glucagon rises, triggering glycogenolysis. Insulin is low but fat oxidation is only ~10-20% of fuel. GH begins to pulse, protecting muscle.' },
  { id:3, start:12, end:18, title:'Fuel Transition', short:'Fat Mobilization',   fuel:'Glycogen + Fat',   organs:['liver','fat','brain'],
    notes:'The body starts easing away from immediate glucose dependence. Fat mobilization begins to rise.',
    science:'Liver glycogen is ~50% depleted. Adipose lipase (HSL) is fully active, releasing fatty acids. Beta-oxidation ramps up. The brain starts accepting small amounts of ketones (BHB begins rising around 0.3 mmol/L).' },
  { id:4, start:18, end:24, title:'Ketosis Entry',   short:'Early Ketosis',      fuel:'Fat + Ketones',    organs:['fat','liver','brain'],
    notes:'Ketone production begins to increase. Appetite starts feeling less urgent. GH rising.',
    science:'BHB levels reach 0.5-1.5 mmol/L — nutritional ketosis. Ghrelin (hunger hormone) paradoxically decreases. Growth hormone surges 5x baseline to preserve lean mass. Autophagy upregulation begins.' },
  { id:5, start:24, end:48, title:'Deep Ketosis',    short:'Fat Adapted',        fuel:'Fat Stores',       organs:['fat','brain','heart'],
    notes:'Fat-derived fuel is doing more of the work. Autophagy processes active.',
    science:'BHB 1.5-3 mmol/L. The brain now runs 60-70% on ketones — this is why mental clarity improves. Autophagy (cellular cleanup) is strongly upregulated via mTOR suppression and AMPK activation. Cortisol remains stable.' },
  { id:6, start:48, end:72, title:'Extended Fast',   short:'Cellular Cleanup',   fuel:'Internal Reserves',organs:['brain','heart','fat'],
    notes:'Cellular cleanup (Autophagy) processes are pronounced.',
    science:'Stem cell regeneration pathways activate. IGF-1 drops dramatically. Autophagy peaks — damaged proteins, organelles, and even pathogens are cleared. Re-feeding after this point triggers significant tissue renewal.' }
];

type ActivityDef = { emoji: string; label: string; multiplier: number; science: string; custom?: boolean };

const INTENSITY_TIERS: { id: string; label: string; multiplier: number; science: string }[] = [
  { id: 'light',      label: 'Light',      multiplier: 2,   science: 'Low-intensity movement activates GLUT4 transporters in muscle independently of insulin, draining glycogen stores without spiking cortisol. Each minute = ~2 min faster entry into fat-burning.' },
  { id: 'moderate',   label: 'Moderate',   multiplier: 2.5, science: 'Moderate-intensity exercise combines aerobic fat oxidation with glycogen depletion. Recovery periods maintain fat burning while active intervals accelerate glycogen clearance.' },
  { id: 'intense',    label: 'Intense',    multiplier: 3,   science: 'High-intensity exercise depletes glycogen 3-4x faster via anaerobic glycolysis. The EPOC (excess post-exercise oxygen consumption) effect continues burning fat for hours after stopping.' },
  { id: 'resistance', label: 'Resistance', multiplier: 2.5, science: 'Resistance training creates glycogen debt that the body repays from fat stores over 24-48h. mTOR activation from lifting is offset during fasting by elevated AMPK, balancing muscle growth with fat loss.' },
];

const DEFAULT_ACTIVITIES: ActivityDef[] = [
  { emoji:"🚶", label:"Walk", multiplier:2,   science: INTENSITY_TIERS[0].science },
  { emoji:"🏃", label:"Run",  multiplier:3,   science: INTENSITY_TIERS[2].science },
  { emoji:"🏋️", label:"Lift", multiplier:2.5, science: INTENSITY_TIERS[3].science },
];

const EXERCISE_EMOJIS = ['🏊','🚴','🧘','🏀','🎾','🏓','⚽','🥊','🧗','🏈','⛷️','🤸','🚣','🏇','💃','🛹'];

type Badge = { id: string; emoji: string; name: string; desc: string; threshold: number; type: 'hours'|'streak'|'mp'|'activity'|'hydration'|'firstfast'; science: string; };
const BADGES: Badge[] = [
  // Beginner
  { id:'firstfast', emoji:'🌅', name:'First Light',        desc:'Complete your first fast', threshold:1,  type:'firstfast', science:'Your first completed fast signals a metabolic shift. Even a single fast improves insulin sensitivity for 24-48h and begins upregulating fat oxidation enzymes.' },
  { id:'firststep', emoji:'👟', name:'First Steps',        desc:'Log your first accelerant',threshold:1,  type:'activity',  science:'Combining exercise with fasting amplifies AMPK activation 2-3x. Your first session creates the template your body will remember and build on.' },
  // Fasting milestones
  { id:'ketosis',   emoji:'🔥', name:'Ketosis Club',       desc:'Complete an 18h fast', threshold:18,  type:'hours',    science:'At 18h, blood BHB crosses 0.5 mmol/L — the clinical threshold for nutritional ketosis. Your brain is now running on ketone fuel.' },
  { id:'autophagy', emoji:'🧬', name:'Autophagy Unlocked', desc:'Complete a 24h fast',  threshold:24,  type:'hours',    science:'24h fasting strongly suppresses mTOR and activates AMPK, triggering cellular autophagy — your body\'s cleanup and recycling system.' },
  { id:'marathon',  emoji:'🏆', name:'Marathon Fast',      desc:'Complete a 48h fast',  threshold:48,  type:'hours',    science:'48h fasting triggers stem cell regeneration in the gut lining and immune system. IGF-1 drops 60%, dramatically slowing cell aging pathways.' },
  // Streaks
  { id:'streak3',   emoji:'⚡', name:'On a Roll',          desc:'3-day fasting streak', threshold:3,   type:'streak',   science:'After 3 consecutive fasting days, mitochondrial biogenesis upregulates. Your cells are literally building more power plants.' },
  { id:'streak7',   emoji:'📅', name:'Iron Will',          desc:'7-day fasting streak', threshold:7,   type:'streak',   science:'7-day fasters show measurable improvements in insulin sensitivity (HOMA-IR), blood pressure, and inflammatory markers (CRP, IL-6).' },
  { id:'streak30',  emoji:'💎', name:'Diamond Mind',       desc:'30-day fasting streak',threshold:30,  type:'streak',   science:'30-day metabolic adaptation: your fat oxidation enzymes (CPT-1, HADHA) are significantly upregulated. You are now fat-adapted at the enzymatic level.' },
  // Mind Points
  { id:'century',   emoji:'💯', name:'Century',            desc:'Earn 100 Mind Points', threshold:100, type:'mp',       science:'Behavioral science shows it takes ~21-66 days to form a habit. 100 Mind Points means you\'ve reinforced self-control pathways repeatedly — the neural grooves are forming.' },
  { id:'mp500',     emoji:'🧠', name:'Mind Over Matter',   desc:'Earn 500 Mind Points', threshold:500, type:'mp',       science:'500 Mind Points represents hundreds of deliberate choices. Prefrontal cortex gray matter density measurably increases with sustained self-regulation practice.' },
  { id:'mp1000',    emoji:'🏛️', name:'Stoic',              desc:'Earn 1000 Mind Points',threshold:1000,type:'mp',       science:'At 1000 MP, your self-control pathways are deeply grooved. Studies show this level of behavioral reinforcement creates automatic habits — discipline becomes effortless.' },
  // Activity
  { id:'mover',     emoji:'🏅', name:'Mover',              desc:'Log 5 activity sessions',threshold:5, type:'activity', science:'Exercise during fasting boosts AMPK 2-3x more than either alone. Five sessions means you\'ve compounded the fasting effect significantly.' },
  // Hydration
  { id:'hydrated',  emoji:'💧', name:'Hydrated',           desc:'Log 8 waters in a day', threshold:8,  type:'hydration', science:'Proper hydration during fasting maintains blood volume, supports kidney filtration, and prevents false hunger signals. 8 glasses is the threshold where cognitive performance stops declining.' },
];

const GOAL_OPTIONS = [14, 16, 18, 20, 24, 36, 48];

type RefeedFood = { emoji: string; label: string; quality: 'excellent'|'good'|'fair'|'high-impact'; nextFastBonus: string; insulin: string; science: string; nextFastImpact: string; };
const REFEED_FOODS: RefeedFood[] = [
  { emoji:'🍲', label:'Bone Broth',   quality:'excellent',    nextFastBonus:'+1-2h',  insulin:'none',     science:'Zero insulin response. Electrolytes, collagen, and gelatin gently prime the gut without triggering digestion enzymes. The gold standard refeed.',                nextFastImpact:'Your electrolytes reset cleanly. Next fast will feel easier to start — hunger is blunted and gut is settled.' },
  { emoji:'🥚', label:'Eggs',         quality:'excellent',    nextFastBonus:'+1h',    insulin:'minimal',  science:'High protein, near-zero carb. Minimal insulin response (~2-3 mU/L). Leucine content triggers muscle protein synthesis without refilling glycogen.',          nextFastImpact:'Glycogen stays low. Fat-burning enzymes remain active. Your next fast enters ketosis ~2h faster.' },
  { emoji:'🥑', label:'Avocado',      quality:'excellent',    nextFastBonus:'+1h',    insulin:'minimal',  science:'Monounsaturated fat with minimal carbs. Essentially zero insulin response. Provides satiety without disrupting the ketogenic state.',                        nextFastImpact:'Ketones may remain measurable through the night. Next morning fast starts from a fat-adapted baseline.' },
  { emoji:'🐟', label:'Fish',         quality:'excellent',    nextFastBonus:'+1h',    insulin:'minimal',  science:'Omega-3 rich, high protein, near-zero carb. Fish oil actively reduces inflammation markers (CRP, IL-6) that fasting elevated. The amino acid profile supports muscle repair without glycogen refill.', nextFastImpact:'Anti-inflammatory omega-3s compound with fasting benefits. Next fast starts with lower baseline inflammation and intact fat-burning enzymes.' },
  { emoji:'🍗', label:'Protein',      quality:'good',         nextFastBonus:'+0.5h',  insulin:'moderate', science:'Protein triggers some insulin (via amino acids), but far less than carbs. Glucagon also rises, partially offsetting fat storage. Net effect: muscle is protected, glycogen stays low.', nextFastImpact:'Modest glycogen replenishment. Next fast needs ~1h extra to clear glycogen before entering fat burning.' },
  { emoji:'🥗', label:'Salad',        quality:'good',         nextFastBonus:'+0.5h',  insulin:'low',      science:'Fiber slows any glucose absorption dramatically. Low-calorie density means low insulin. Adding protein or fat dressing improves the response further.',      nextFastImpact:'Gut microbiome gets fiber; next fast morning gut motility is better. Mild glycogen refill only.' },
  { emoji:'🥜', label:'Nuts',         quality:'good',         nextFastBonus:'+0.5h',  insulin:'low',      science:'High fat, moderate protein, low carb. Slow digestion means sustained energy without a glucose spike. Magnesium content helps replenish fasting-depleted stores.',  nextFastImpact:'Minimal glycogen refill. Healthy fats keep fat-oxidation enzymes active. Next fast transitions to fat-burning faster.' },
  { emoji:'🥛', label:'Yogurt',       quality:'good',         nextFastBonus:'+0.5h',  insulin:'low-mod',  science:'Fermented dairy has lower lactose (less sugar) than milk. Probiotics support gut microbiome recovery after fasting. Protein content triggers moderate satiety without heavy glycogen refill.',  nextFastImpact:'Gut microbiome gets a probiotic boost. Next fast may have less bloating and better gut motility.' },
  { emoji:'🍌', label:'Fruit',        quality:'fair',         nextFastBonus:'-0.5h',  insulin:'moderate', science:'Fructose is processed by the liver (not muscles), which can partially refill liver glycogen — the exact store your fast depleted. Insulin spike is moderate.', nextFastImpact:'Liver glycogen partially refilled. Next fast takes 1-2h longer to reach fat-burning phase.' },
  { emoji:'🍚', label:'Rice/Carbs',   quality:'fair',         nextFastBonus:'-1h',    insulin:'high',     science:'High-glycemic carbs spike insulin strongly (~60-80 mU/L). Muscle and liver glycogen refill rapidly. Fat oxidation is suppressed for 3-4h post-meal.',      nextFastImpact:'Full glycogen reload. Next fast requires 4-6h longer to work through glycogen before fat burning begins.' },
  { emoji:'🍕', label:'Full Meal',    quality:'high-impact',  nextFastBonus:'-2h',    insulin:'very high',science:'Mixed macros create a large, sustained insulin response. Glycogen fills completely, triglycerides rise. All fat-burning mechanisms fully suppressed for 4-6h.',  nextFastImpact:'Complete metabolic reset. Next fast essentially starts from zero — no residual fat-adapted benefit carries over.' },
  { emoji:'🍫', label:'Sugar/Sweets', quality:'high-impact',  nextFastBonus:'-3h',    insulin:'extreme',  science:'Pure glucose/fructose — maximal insulin spike. Dopamine surge creates cravings within hours. This undoes much of the metabolic benefit of your fast.', nextFastImpact:'Insulin spike triggers fat storage, glycogen overfills, and cravings make starting the next fast significantly harder.' },
];

const REFEED_MP: Record<string, number> = { excellent: 15, good: 10, fair: 5, 'high-impact': 0 };

const QUALITY_COLORS: Record<string, string> = {
  excellent:      'border-green-500/40 bg-green-500/10 text-green-300',
  good:           'border-cyan-500/30  bg-cyan-500/10  text-cyan-300',
  fair:           'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  'high-impact':  'border-red-500/30   bg-red-500/10   text-red-300',
};

const getRefeedGuidance = (hours: number) => {
  if (hours >= 48) return {
    title: 'Extended Fast Refeed (48h+)',
    urgent: 'Careful — your GI tract has been fully resting. Refeeding syndrome is a real risk.',
    steps: [
      '🍲 Start with bone broth only — nothing solid for 30-60 min',
      '🥚 Small protein serving next — eggs or white fish',
      '🚫 No raw vegetables, dairy, or large portions for first meal',
      '⏱ Space meals 2-3h apart for the first day',
      '💧 Keep hydrating — your body will pull fluid into cells rapidly',
    ],
  };
  if (hours >= 24) return {
    title: '24h Fast Refeed Protocol',
    urgent: 'Your stomach acid and enzyme production is significantly reduced.',
    steps: [
      '🍲 Bone broth or small protein first — give your gut 20-30 min',
      '🥚 Eggs or fish as your first real meal — easy to digest',
      '🚫 Avoid high-fiber raw veg and dairy for the first meal',
      '🍚 Complex carbs are fine post-24h — glycogen is depleted',
      '⏱ Wait 45 min between first and second meal',
    ],
  };
  return {
    title: '16-20h Fast Refeed Protocol',
    urgent: 'Your insulin sensitivity is at its peak right now — use it wisely.',
    steps: [
      '🥚 Prioritize protein + fat first (eggs, avocado, nuts)',
      '🚫 Avoid sugar and refined carbs — insulin spike will hit hard',
      '⏱ Wait 20 min before eating a full meal',
      '💧 Continue hydrating — hunger may be partly thirst',
      '🍚 If eating carbs, add protein first to blunt the glucose spike',
    ],
  };
};

const MP_ACTIONS = [
  { icon: Footprints, color: 'cyan',   points: 20, label: 'Walked Off a Craving', science: 'Walking for 10-15 minutes suppresses ghrelin (hunger hormone) and raises GLP-1 and peptide YY (satiety hormones). This "exercise-induced anorexia" effect lasts 1-2 hours. Any exercise works the same way — running, cycling, even stretching — but walking is the easiest to do in the moment.' },
  { icon: Zap,        color: 'cyan',   points: 15, label: 'Post-Meal Walk',       science: 'A 10-15 minute walk after eating reduces your glucose spike by 30-50%, keeping insulin lower and shortening the time to return to fat-burning. Any moderate movement works, but walking is ideal — low enough intensity that it doesn\'t divert blood away from digestion.' },
  { icon: ShieldCheck,color: 'purple', points: 15, label: 'Refused a Treat',      science: 'Each successful act of food refusal strengthens the prefrontal cortex\'s inhibitory control pathways. You are literally rewiring your brain toward discipline with every "no". fMRI studies show this region grows measurably denser with repeated self-control.' },
  { icon: Brain,      color: 'purple', points: 10, label: 'No Late Snack',        science: 'Late-night eating disrupts circadian insulin rhythms. Eating after 9-10pm keeps insulin elevated during the window your body should be in deep fat-burning mode. A strict cutoff extends your overnight fast by 1-2h and improves morning cortisol response.' },
  { icon: Droplets,   color: 'cyan',   points: 10, label: 'Water Over Snack',     science: 'Mild dehydration mimics hunger signals — the hypothalamus processes both thirst and hunger, and often confuses them. Studies show that drinking water before a meal reduces calorie intake by 13%. Next time you feel a craving, drink a glass and wait 15 minutes.' },
  { icon: Moon,       color: 'purple', points: 15, label: 'Slept 7+ Hours',       science: 'One night of poor sleep (<6h) raises ghrelin by 28% and drops leptin by 18% — making you hungrier and less satisfied the next day. Sleep is the invisible multiplier behind every other discipline habit. Protect it.' },
];

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
  const [weightLog, setWeightLog] = useState<{weight:number;ts:string}[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [refeedLogged, setRefeedLogged] = useState<RefeedFood[]>([]);
  const [showRefeedSection, setShowRefeedSection] = useState(true);
  const [showEndFastModal, setShowEndFastModal] = useState(false);
  const [endPickerValue, setEndPickerValue] = useState("");
  const [fastHistory, setFastHistory] = useState<{start:string;end:string;hours:number;refeed:{emoji:string;label:string;quality:string}[];streak:number}[]>([]);
  const [historyView, setHistoryView] = useState<'list' | 'calendar'>('calendar');

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Plate Scan state
  const [plateScanImage, setPlateScanImage] = useState<string | null>(null);
  const [plateScanResult, setPlateScanResult] = useState<any>(null);
  const [plateScanLoading, setPlateScanLoading] = useState(false);
  const [showPlateScan, setShowPlateScan] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  const plateScanInputRef = useRef<HTMLInputElement>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDef | null>(null);
  const [activityMinutes, setActivityMinutes] = useState(30);
  const [customActivities, setCustomActivities] = useState<ActivityDef[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActName, setNewActName] = useState('');
  const [newActEmoji, setNewActEmoji] = useState('🏊');
  const [newActTier, setNewActTier] = useState('moderate');
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const isDev = session?.user?.email === 'drjmpdds@gmail.com';
  const devLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sandbox helper — skips Supabase writes when dev mode is active
  const dbUpdate = (data: Record<string, any>) => {
    if (devMode) return Promise.resolve();
    if (!session) return Promise.resolve();
    return supabase.from('profiles').update(data).eq('id', session.user.id);
  };
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

  // ── GYROSCOPE SHIMMER ──
  const [hasGyro, setHasGyro] = useState(false);
  const [gyroAttempted, setGyroAttempted] = useState(false);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const gyroActiveRef = useRef(false);

  const handleOrientation = useRef((e: DeviceOrientationEvent) => {
    if (!shimmerRef.current) return;
    const x = Math.max(0, Math.min(100, ((e.gamma || 0) + 45) / 90 * 100));
    const y = Math.max(0, Math.min(100, ((e.beta || 0) + 30) / 120 * 100));
    const angle = 110 + (e.gamma || 0) * 0.5;
    shimmerRef.current.style.setProperty('--shimmer-x', String(x));
    shimmerRef.current.style.setProperty('--shimmer-y', String(y));
    shimmerRef.current.style.setProperty('--shimmer-angle', String(angle));
  }).current;

  const requestGyroPermission = async () => {
    if (gyroActiveRef.current || gyroAttempted) return;
    setGyroAttempted(true);

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS — must be called from user gesture
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === 'granted') {
          gyroActiveRef.current = true;
          setHasGyro(true);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch { /* denied */ }
    } else {
      // Android — check if events fire
      const testHandler = (e: DeviceOrientationEvent) => {
        if (e.gamma !== null) {
          gyroActiveRef.current = true;
          setHasGyro(true);
          window.addEventListener('deviceorientation', handleOrientation);
        }
        window.removeEventListener('deviceorientation', testHandler);
      };
      window.addEventListener('deviceorientation', testHandler);
      setTimeout(() => window.removeEventListener('deviceorientation', testHandler), 1000);
    }
  };

  useEffect(() => {
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.max(0, (new Date().getTime() - startTime.getTime()) / 36e5));
    }, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const currentH = elapsed + bonus;
    if (currentH >= goalHours && !goalReachedRef.current && elapsed > 0) {
      goalReachedRef.current = true;
      setShowGoalCelebration(true);
      if (currentH > maxHoursEver) {
        const newMax = currentH;
        setMaxHoursEver(newMax);
        checkAndAwardBadges(newMax, streak, totalMpEver, activityCount, badgesEarned);
        dbUpdate({ max_hours_ever: newMax });
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
      setWaterCount(data.water_count || 0);
      setElectrolyteCount(data.electrolyte_count || 0);
      const earned = data.badges_earned ? JSON.parse(data.badges_earned) : [];
      setBadgesEarned(earned);
      if (data.activity_log) { try { setActivityLog(JSON.parse(data.activity_log)); } catch {} }
      if (data.weight_log)   { try { setWeightLog(JSON.parse(data.weight_log)); } catch {} }
      if (data.fast_history) { try { setFastHistory(JSON.parse(data.fast_history)); } catch {} }
      if (data.mp_log) { try { setMpLog(JSON.parse(data.mp_log)); } catch {} }
      if (data.custom_activities) { try { setCustomActivities(JSON.parse(data.custom_activities)); } catch {} }
      const accMin = data.accelerant_minutes || 0;
      setBonus(accMin / 60);
      setAccelerantMinutes(accMin);
      if (data.fast_start_time) {
        const st = new Date(data.fast_start_time);
        setStartTime(st);
        const realH = Math.max(0, (new Date().getTime() - st.getTime()) / 36e5);
        setElapsed(realH);
        if (realH >= (data.fast_goal_hours || 18)) goalReachedRef.current = true;
      }
    }
  };

  const checkAndAwardBadges = (maxH: number, str: number, totalMp: number, actCount: number, current: string[], wCount?: number) => {
    const next = [...current];
    let newest: Badge | null = null;
    const fastCount = fastHistory.length + (maxH > 0 && !next.includes('firstfast') ? 1 : 0);
    for (const b of BADGES) {
      if (next.includes(b.id)) continue;
      const ok = (b.type==='hours' && maxH>=b.threshold) || (b.type==='streak' && str>=b.threshold) ||
                 (b.type==='mp' && totalMp>=b.threshold) || (b.type==='activity' && actCount>=b.threshold) ||
                 (b.type==='hydration' && (wCount ?? waterCount) >= b.threshold) ||
                 (b.type==='firstfast' && fastCount >= b.threshold);
      if (ok) { next.push(b.id); newest = b; }
    }
    if (next.length !== current.length) {
      setBadgesEarned(next);
      if (newest) setShowBadgeCelebration(newest);
      dbUpdate({ badges_earned: JSON.stringify(next) });
    }
    return next;
  };

  const handleAuth = async () => {
    const email = prompt("Enter your email for the Magic Link login:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message);
    else alert("Check your email for the magic login link!");
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert(error.message);
  };

  const importLegacyData = async () => {
    const code = prompt("Paste your Gazelam Sync Code:");
    if (!code) return;
    try {
      const payload = JSON.parse(code.replace("GAZELAM_SYNC_PAYLOAD:", ""));
      if (!session) { alert("Please sign in first."); return; }
      const result = await dbUpdate({
        mind_points: payload.fastData?.mindPoints || 0,
        fast_start_time: payload.start || null,
        accelerant_minutes: payload.fastData?.accelerantMinutes || 0,
        updated_at: new Date().toISOString(),
      });
      const error = result && 'error' in result ? (result as any).error : null;
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
    const realH = Math.max(0, (new Date().getTime() - chosen.getTime()) / 36e5);
    setStartTime(chosen); setElapsed(realH); setBonus(0);
    setAccelerantMinutes(0); setActivityLog([]); setWaterCount(0); setElectrolyteCount(0);
    goalReachedRef.current = realH >= goalHours;
    setShowStartPicker(false);
    await dbUpdate({
      fast_start_time: chosen.toISOString(), accelerant_minutes: 0,
      activity_log: '[]', water_count: 0, electrolyte_count: 0,
    });
  };

  const openActivity = (act: ActivityDef) => {
    setSelectedActivity(act); setActivityMinutes(30); setShowActivityModal(true);
  };

  const allActivities = [...DEFAULT_ACTIVITIES, ...customActivities];

  const saveCustomActivity = async () => {
    if (!newActName.trim()) return;
    const tier = INTENSITY_TIERS.find(t => t.id === newActTier) || INTENSITY_TIERS[1];
    const act: ActivityDef = { emoji: newActEmoji, label: newActName.trim(), multiplier: tier.multiplier, science: tier.science, custom: true };
    const updated = [...customActivities, act];
    setCustomActivities(updated);
    setShowAddActivity(false);
    setNewActName(''); setNewActEmoji('🏊'); setNewActTier('moderate');
    await dbUpdate({ custom_activities: JSON.stringify(updated) });
  };

  const removeCustomActivity = async (label: string) => {
    const updated = customActivities.filter(a => a.label !== label);
    setCustomActivities(updated);
    await dbUpdate({ custom_activities: JSON.stringify(updated) });
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
    setBonus(newBonus); setAccelerantMinutes(newAccelTotal); setActivityLog(newLog); setActivityCount(newActCount);
    setShowActivityModal(false); triggerScan();
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, totalMpEver, newActCount, badgesEarned);
    await dbUpdate({
      accelerant_minutes: newAccelTotal, activity_log: JSON.stringify(newLog),
      activity_count: newActCount, badges_earned: JSON.stringify(newBadges),
    });
  };

  const logWater = async () => {
    const n = waterCount + 1; setWaterCount(n);
    const pts = 5;
    const newMp = mp + pts, newTotal = totalMpEver + pts;
    setMp(newMp); setTotalMpEver(newTotal);
    const entry = { label: 'Water', points: pts, time: new Date().toISOString() };
    const newLog = [entry, ...mpLog].slice(0, 50);
    setMpLog(newLog);
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, newTotal, activityCount, badgesEarned, n);
    await dbUpdate({
      water_count: n, mind_points: newMp, total_mp_ever: newTotal, mp_log: JSON.stringify(newLog),
      badges_earned: JSON.stringify(newBadges),
    });
  };

  const logElectrolyte = async () => {
    const n = electrolyteCount + 1; setElectrolyteCount(n);
    const pts = 5;
    const newMp = mp + pts, newTotal = totalMpEver + pts;
    setMp(newMp); setTotalMpEver(newTotal);
    const entry = { label: 'Electrolytes', points: pts, time: new Date().toISOString() };
    const newLog = [entry, ...mpLog].slice(0, 50);
    setMpLog(newLog);
    await dbUpdate({
      electrolyte_count: n, mind_points: newMp, total_mp_ever: newTotal, mp_log: JSON.stringify(newLog),
    });
  };

  const logWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 50 || w > 500) return;
    const entry = { weight: w, ts: new Date().toISOString() };
    const newLog = [...weightLog, entry].slice(-30); // keep last 30
    setWeightLog(newLog); setWeightInput(""); setShowWeightInput(false);
    await dbUpdate({ weight_log: JSON.stringify(newLog) });
  };

  const triggerScan = () => { setShowScanner(true); setTimeout(() => setShowScanner(false), 2000); };

  // ── Plate Scan ──
  // Compress image to max 1MB JPEG for API
  const compressImage = (file: File, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePlateScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPlateScanImage(base64);
      setShowPlateScan(true);
      setScanPhase('scanning');
      setPlateScanResult(null);
      setPlateScanLoading(true);
      const res = await fetch('/api/analyze-refeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          fastDuration: currentH || 0,
          userGoal: null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error + (data.raw ? '\n\nRaw: ' + data.raw : ''));
      setPlateScanResult(data);
      setScanPhase('done');
    } catch (err: any) {
      setPlateScanResult({ error: err.message || 'Analysis failed' });
      setScanPhase('done');
    } finally {
      setPlateScanLoading(false);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const logRefeed = async (food: RefeedFood) => {
    const isSelected = refeedLogged.some(f => f.label === food.label);
    if (isSelected) {
      setRefeedLogged(prev => prev.filter(f => f.label !== food.label));
    } else {
      setRefeedLogged(prev => [...prev, food]);
      // Award MP for good refeed choices
      const pts = REFEED_MP[food.quality] || 0;
      if (pts > 0) {
        const points = Math.round(pts * streakMultiplier);
        const newMp = mp + points, newTotal = totalMpEver + points;
        setMp(newMp); setTotalMpEver(newTotal);
        const entry = { label: `Refeed: ${food.label}`, points, time: new Date().toISOString() };
        const newLog = [entry, ...mpLog].slice(0, 50);
        setMpLog(newLog);
        await dbUpdate({
          last_refeed: food.label, mind_points: newMp, total_mp_ever: newTotal, mp_log: JSON.stringify(newLog),
        });
        return;
      }
    }
    await dbUpdate({ last_refeed: food.label });
  };

  const endFast = async (customEndTime?: Date) => {
    const endTime = customEndTime || new Date();
    // Recalculate hours if custom end time provided
    const actualElapsed = startTime ? (endTime.getTime() - startTime.getTime()) / 3600000 : elapsed;
    const completedH = actualElapsed + bonus;
    const newStreak = streak + 1;
    const newMax = Math.max(maxHoursEver, completedH);
    setStreak(newStreak);
    setMaxHoursEver(newMax);
    const newBadges = checkAndAwardBadges(newMax, newStreak, totalMpEver, activityCount, badgesEarned);

    // Build fast history record
    const record = {
      start: startTime?.toISOString() || new Date().toISOString(),
      end: endTime.toISOString(),
      hours: parseFloat(completedH.toFixed(1)),
      refeed: refeedLogged.map(f => ({ emoji: f.emoji, label: f.label, quality: f.quality })),
      streak: newStreak,
    };
    const newHistory = [record, ...fastHistory].slice(0, 30); // keep last 30 fasts
    setFastHistory(newHistory);
    setShowEndFastModal(false);

    // Reset fast state
    setStartTime(null); setElapsed(0); setBonus(0); setAccelerantMinutes(0);
    setActivityLog([]); setWaterCount(0); setElectrolyteCount(0); setRefeedLogged([]);
    goalReachedRef.current = false;

    await dbUpdate({
      streak: newStreak, max_hours_ever: newMax, fast_start_time: null,
      accelerant_minutes: 0, activity_log: '[]', water_count: 0, electrolyte_count: 0,
      badges_earned: JSON.stringify(newBadges),
      fast_history: JSON.stringify(newHistory),
      last_refeed: refeedLogged.map(f => f.label).join(', '),
    });
  };

  const streakMultiplier = Math.min(3, 1 + streak * 0.1);

  const [mpLog, setMpLog] = useState<{ label: string; points: number; time: string }[]>([]);
  const [showMpLog, setShowMpLog] = useState(false);
  const [undoMp, setUndoMp] = useState<{ points: number; timer: ReturnType<typeof setTimeout> } | null>(null);

  const addMp = async (base: number, label: string) => {
    // clear any pending undo — commit previous entry
    if (undoMp) clearTimeout(undoMp.timer);

    const points = Math.round(base * streakMultiplier);
    const newMp = mp + points, newTotal = totalMpEver + points;
    setMp(newMp); setTotalMpEver(newTotal);
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, newTotal, activityCount, badgesEarned);

    const entry = { label, points, time: new Date().toISOString() };
    const newLog = [entry, ...mpLog].slice(0, 50);
    setMpLog(newLog);

    // set undo window — persist to DB only after timeout
    const timer = setTimeout(async () => {
      setUndoMp(null);
      await dbUpdate({
        mind_points: newMp, total_mp_ever: newTotal, badges_earned: JSON.stringify(newBadges),
        mp_log: JSON.stringify(newLog),
      });
    }, 4000);

    setUndoMp({ points, timer });
  };

  const handleUndoMp = () => {
    if (!undoMp) return;
    clearTimeout(undoMp.timer);
    const restoredMp = mp - undoMp.points;
    const restoredTotal = totalMpEver - undoMp.points;
    setMp(restoredMp);
    setTotalMpEver(restoredTotal);
    setMpLog(prev => prev.slice(1)); // remove the last entry
    setUndoMp(null);
  };

  const [devHours, setDevHours] = useState(24);
  const [devVelocity, setDevVelocity] = useState(1.5);

  if (!mounted) return null;
  const realH = elapsed + bonus;
  const currentH = devMode ? devHours : realH;
  const currentPhase = PHASES.find(p => currentH >= p.start && currentH < p.end) || PHASES[PHASES.length - 1];

  // ── Metabolic Velocity Engine ──
  const realVelocity = elapsed > 0.5 ? (elapsed + bonus) / elapsed : 1;
  const velocity = devMode ? devVelocity : realVelocity;
  // Predict real-time hours until a target metabolic hour is reached
  const getETA = (targetH: number): number | null => {
    if (currentH >= targetH) return null; // already passed
    if (!startTime && !devMode) return null; // not fasting
    const remainingMetabolicH = targetH - currentH;
    return remainingMetabolicH / velocity; // real hours needed at current pace
  };
  const formatETA = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };
  const goalProgress = Math.min(100, (currentH / goalHours) * 100);
  const fatPct = Math.min(95, Math.round(
    currentH <= 4  ? 0 :
    currentH <= 12 ? ((currentH-4)/8)*15 :
    currentH <= 18 ? 15+((currentH-12)/6)*20 :
    currentH <= 24 ? 35+((currentH-18)/6)*25 :
    currentH <= 48 ? 60+((currentH-24)/24)*25 :
    85+((currentH-48)/24)*10
  ));
  const glycogenPct = 100 - fatPct;
  const weightValues = weightLog.map(e => e.weight);
  const firstWeight = weightValues[0];
  const lastWeight = weightValues[weightValues.length - 1];
  const weightDelta = weightLog.length >= 2 ? lastWeight - firstWeight : null;

  return (
    <div className="min-h-screen text-[#f4f7fb]">

      {/* ── END FAST CONFIRMATION ── */}
      <AnimatePresence>
        {showEndFastModal && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowEndFastModal(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-orange-500/30 rounded-[2.5rem] p-8 z-[201] shadow-2xl text-center">
              <div className="text-5xl mb-4">🏁</div>
              <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">End Your Fast?</h2>
              <p className="text-[#98a4bb] text-sm mb-2">You've gone <span className="text-white font-black">{currentH.toFixed(1)}h</span> — that's a {streak+1}-day streak.</p>
              {refeedLogged.length === 0 && <p className="text-yellow-400 text-xs mb-4 font-bold">💡 Tip: Log your refeed below before ending for best tracking.</p>}
              {refeedLogged.length > 0 && <p className="text-green-400 text-xs mb-4 font-bold">✓ Logged: {refeedLogged.map(f => `${f.emoji} ${f.label}`).join(', ')}</p>}
              {/* Custom end time picker */}
              <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-3">
                <label className="text-[0.55rem] font-black uppercase tracking-widest text-[#6b7280] block mb-2">End time (leave blank for now)</label>
                <input
                  type="datetime-local"
                  value={endPickerValue}
                  onChange={e => setEndPickerValue(e.target.value)}
                  max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  min={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold"
                />
                {endPickerValue && startTime && (() => {
                  const endT = new Date(endPickerValue);
                  const adjH = (endT.getTime() - startTime.getTime()) / 3600000 + bonus;
                  return <div className="text-[0.6rem] text-cyan-400 font-bold mt-1">Fast will be logged as {adjH.toFixed(1)}h</div>;
                })()}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowEndFastModal(false); setEndPickerValue(''); }}
                  className="flex-1 bg-white/5 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl">KEEP GOING</button>
                <button onClick={() => { const endT = endPickerValue ? new Date(endPickerValue) : undefined; endFast(endT); setEndPickerValue(''); }}
                  className="flex-1 bg-gradient-to-br from-orange-400 to-red-500 text-white font-black py-4 rounded-2xl">END FAST</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── GOAL CELEBRATION ── */}
      <AnimatePresence>
        {showGoalCelebration && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowGoalCelebration(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.8, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-yellow-500/50 rounded-[2.5rem] p-10 z-[201] text-center">
              <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:3, duration:0.5 }} className="text-6xl mb-4">🏆</motion.div>
              <h2 className="text-3xl font-black text-yellow-400 mb-2 tracking-tighter">GOAL REACHED!</h2>
              <p className="text-[#98a4bb] mb-2">You hit your <span className="text-white font-bold">{goalHours}h</span> fasting target!</p>
              <p className="text-cyan-400 font-bold text-sm mb-8">Day {streak} streak 🔥</p>
              <button onClick={() => setShowGoalCelebration(false)}
                className="w-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl text-lg">LET'S GO! 💪</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BADGE CELEBRATION ── */}
      <AnimatePresence>
        {showBadgeCelebration && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowBadgeCelebration(null)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.8, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-purple-500/50 rounded-[2.5rem] p-10 z-[201] text-center">
              <motion.div animate={{ rotate:[0,-10,10,-10,0] }} transition={{ duration:0.5 }} className="text-6xl mb-4">{showBadgeCelebration.emoji}</motion.div>
              <div className="text-xs font-black text-purple-400 tracking-widest uppercase mb-2">Badge Unlocked!</div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">{showBadgeCelebration.name}</h2>
              <p className="text-[#98a4bb] text-sm mb-3">{showBadgeCelebration.desc}</p>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3 mb-6 text-left">
                <p className="text-[0.65rem] text-purple-200 leading-relaxed">{showBadgeCelebration.science}</p>
              </div>
              <button onClick={() => setShowBadgeCelebration(null)}
                className="w-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-black py-4 rounded-2xl">NICE! 🎉</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ACTIVITY MODAL ── */}
      <AnimatePresence>
        {showActivityModal && selectedActivity && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowActivityModal(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-cyan-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <div className="text-4xl mb-3">{selectedActivity.emoji}</div>
              <h2 className="text-2xl font-black text-white mb-1 tracking-tighter">Log {selectedActivity.label}</h2>
              <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-2xl p-3 mb-4">
                <p className="text-[0.65rem] text-[#98a4bb] leading-relaxed">{selectedActivity.science}</p>
              </div>
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#98a4bb] mb-2 block">Duration (minutes)</label>
              <input type="number" min={1} max={300} value={activityMinutes}
                onChange={e => setActivityMinutes(Math.max(1, parseInt(e.target.value)||1))}
                className="w-full bg-black/40 border border-white/10 text-white text-2xl font-black rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 text-center mb-2" />
              <div className="text-center text-cyan-400 font-bold text-sm mb-4">
                = +{(activityMinutes * selectedActivity.multiplier / 60).toFixed(2)}h fasting bonus
              </div>
              <div className="flex gap-2 mb-6">
                {[15,30,45,60].map(m => (
                  <button key={m} onClick={() => setActivityMinutes(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${activityMinutes===m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-[#98a4bb]'}`}>{m}m</button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowActivityModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl">CANCEL</button>
                <button onClick={confirmActivity}
                  className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black py-4 rounded-2xl">LOG IT</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD CUSTOM ACTIVITY MODAL ── */}
      <AnimatePresence>
        {showAddActivity && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowAddActivity(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-cyan-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-4 tracking-tighter">Add Activity</h2>

              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#98a4bb] mb-2 block">Emoji</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {EXERCISE_EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewActEmoji(e)}
                    className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newActEmoji === e ? 'bg-cyan-500/20 border border-cyan-500/50 scale-110' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                    {e}
                  </button>
                ))}
              </div>

              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#98a4bb] mb-2 block">Name</label>
              <input type="text" value={newActName} onChange={e => setNewActName(e.target.value)} placeholder="e.g. Pickleball"
                maxLength={20}
                className="w-full bg-black/40 border border-white/10 text-white text-lg font-black rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 mb-4" />

              <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#98a4bb] mb-2 block">Intensity</label>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {INTENSITY_TIERS.map(tier => (
                  <button key={tier.id} onClick={() => setNewActTier(tier.id)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${newActTier === tier.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-[#98a4bb]'}`}>
                    {tier.label} <span className="opacity-50">{tier.multiplier}x</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAddActivity(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl">CANCEL</button>
                <button onClick={saveCustomActivity} disabled={!newActName.trim()}
                  className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black py-4 rounded-2xl disabled:opacity-30">ADD</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── START FAST PICKER ── */}
      <AnimatePresence>
        {showStartPicker && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowStartPicker(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f131c] border-2 border-cyan-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">When did you start?</h2>
              <p className="text-[#98a4bb] text-sm mb-6">Set the actual time your fast began.</p>
              <input type="datetime-local" value={pickerValue} onChange={e => setPickerValue(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-4 py-3 mb-6 focus:outline-none focus:border-cyan-500/50 text-sm" />
              <div className="flex gap-3">
                <button onClick={() => setShowStartPicker(false)}
                  className="flex-1 bg-white/5 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl">CANCEL</button>
                <button onClick={confirmStartFast}
                  className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black py-4 rounded-2xl">START FAST</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PHASE MODAL ── */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSelectedPhase(null)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-[#0f131c] border-2 border-purple-500/30 rounded-[2.5rem] p-8 z-[101] shadow-2xl">
              <h2 className="text-3xl font-black text-purple-400 mb-2 tracking-tighter uppercase">{selectedPhase.title}</h2>
              <div className="text-xs font-bold text-cyan-400 mb-4 tracking-widest uppercase">Biology: {selectedPhase.short}</div>
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center relative">
                <img src={`/images/stage${selectedPhase.id}.png`} alt={selectedPhase.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f131c] via-transparent to-transparent" />
              </div>
              <div className="space-y-3 text-sm text-[#98a4bb] leading-relaxed">
                <p><strong className="text-white">Overview:</strong> {selectedPhase.notes}</p>
                <p><strong className="text-white">Primary Fuel:</strong> {selectedPhase.fuel}</p>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3">
                  <div className="text-[0.6rem] font-black uppercase tracking-widest text-purple-400 mb-1">🔬 Deep Science</div>
                  <p className="text-[0.72rem] text-purple-100 leading-relaxed">{selectedPhase.science}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPhase(null)}
                className="w-full mt-6 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-100 font-bold py-4 rounded-2xl transition-all">GOT IT</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="Fallow" className="w-14 h-14 md:w-16 md:h-16 rounded-2xl" />
            <h1 className="text-6xl md:text-7xl font-[900] tracking-tighter text-white uppercase italic">FALLOW</h1>
          </div>
          <p className="text-[#98a4bb] font-medium mt-3 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 shrink-0 rounded-full bg-cyan-500 animate-pulse" />
            {session ? <span className="truncate">Active: <span className="text-cyan-400 font-bold">{session.user.email}</span></span>
              : "Metabolic Renewal Engine v2.0"}
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
            <div className="flex gap-2">
              <button onClick={handleGoogleLogin}
                className="bg-white text-black px-4 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 hover:bg-gray-100">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                GOOGLE
              </button>
              <button onClick={handleAuth}
                className="bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 text-white">
                <LogIn className="w-5 h-5 text-cyan-400" /> {loading ? <Loader2 className="animate-spin" /> : "EMAIL"}
              </button>
            </div>
          )}
          {startTime && (
            <button onClick={() => setShowEndFastModal(true)}
              className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight uppercase">
              END FAST
            </button>
          )}
          <button onClick={openStartPicker}
            className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-tight uppercase">
            {startTime ? 'RESTART' : 'START FAST'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* TIMER CARD */}
          <section className="bg-white/[0.04] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Live Fasting State
            </h2>
            <div className="mb-4">
              <Tooltip content={
                <div>
                  <div className="font-black text-cyan-400 mb-1">⏱ {currentH.toFixed(1)} hours fasted</div>
                  <div className="font-bold text-white mb-1">{currentPhase.title}</div>
                  <p>{currentPhase.science}</p>
                </div>
              }>
                <div className="inline-block cursor-help">
                  <div className="text-6xl font-black tracking-tighter text-white flex items-baseline gap-2">
                    {currentH.toFixed(1)}<span className="text-2xl text-[#4b5563]">h</span>
                  </div>
                  <div className="text-cyan-400 font-bold text-sm tracking-tight mt-1 uppercase flex items-center gap-1">
                    {currentPhase.short} <Info className="w-3 h-3 opacity-40" />
                  </div>
                </div>
              </Tooltip>
            </div>

            {/* GOAL PROGRESS */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563]">Goal Progress</span>
                <button onClick={() => setShowGoalPicker(s => !s)}
                  className="text-[0.6rem] font-black text-cyan-500 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  <Target className="w-3 h-3" /> {goalHours}h
                </button>
              </div>
              <div className="h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width:`${goalProgress}%` }} transition={{ duration:0.8, ease:"easeOut" }}
                  className={`h-full rounded-full ${goalProgress>=100 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} />
              </div>
              <div className="text-right text-[0.6rem] text-[#4b5563] mt-1 font-bold">
                {goalProgress >= 100 ? '✓ COMPLETE' : `${goalProgress.toFixed(0)}%`}
              </div>
            </div>

            <AnimatePresence>
              {showGoalPicker && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  className="mb-4 overflow-hidden">
                  <div className="grid grid-cols-4 gap-1">
                    {GOAL_OPTIONS.map(h => (
                      <button key={h} onClick={() => { setGoalHours(h); setShowGoalPicker(false); goalReachedRef.current = currentH>=h;
                        dbUpdate({ fast_goal_hours: h }); }}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${goalHours===h ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-[#98a4bb]'}`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[0.65rem] text-[#98a4bb] font-bold uppercase tracking-wider mb-4">
              Bonus: <span className="text-cyan-400">+{bonus.toFixed(1)}h</span>
            </div>

            {/* FUEL MIX */}
            <div className="space-y-2">
              <Tooltip content={
                <div>
                  <div className="font-black text-white mb-2">Est. Fuel Mix</div>
                  <p className="text-blue-300 mb-2"><strong>Glycogen ({glycogenPct}%):</strong> Glucose stored in liver (~100g, ~400 kcal). Primary fuel until ~12-18h of fasting.</p>
                  <p className="text-purple-300"><strong>Fat/Ketones ({fatPct}%):</strong> Fatty acids converted to BHB by the liver. A cleaner fuel — less oxidative stress, more ATP per molecule. Your brain loves ketones.</p>
                </div>
              }>
                <h2 className="text-[0.65rem] uppercase tracking-widest text-[#98a4bb] font-black flex items-center gap-1 cursor-help">
                  Est. Fuel Mix <Info className="w-3 h-3 opacity-40" />
                </h2>
              </Tooltip>
              <div className="h-10 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex p-1">
                <motion.div animate={{ width:`${glycogenPct}%` }} transition={{ duration:1, ease:"easeInOut" }}
                  className="h-full bg-blue-500/40 rounded-xl border border-blue-400/20" />
                {fatPct > 0 && (
                  <motion.div animate={{ width:`${fatPct}%` }} transition={{ duration:1, ease:"easeInOut" }}
                    className="h-full bg-purple-500/40 rounded-xl border border-purple-400/20 ml-1" />
                )}
              </div>
              <div className="flex justify-between text-[0.6rem] font-black uppercase tracking-tighter">
                <span className="text-blue-400">Glycogen: {glycogenPct}%</span>
                <span className="text-purple-400">Fat/Ketones: {fatPct}%</span>
              </div>
            </div>
          </section>

          {/* MIND POINTS */}
          <section className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
              <Tooltip content={
                <div>
                  <div className="font-black text-purple-400 mb-1">🧠 Mind Points</div>
                  <p>Mind Points track behavioral reinforcement. Each action you take strengthens the neural pathways associated with discipline and self-control. This is neuroplasticity in action.</p>
                  {streak >= 2 && <p className="mt-2 text-yellow-300 font-bold">Streak multiplier: {streakMultiplier.toFixed(1)}x — consecutive days amplify your willpower pathways.</p>}
                </div>
              }>
                <div className="cursor-help">
                  <div className="text-5xl font-black text-purple-400 mb-1 leading-none">{mp}</div>
                  <div className="text-[0.65rem] bg-purple-500/20 px-3 py-1 rounded-full text-purple-200 font-black tracking-widest uppercase inline-flex items-center gap-1">
                    Mind Points <Info className="w-3 h-3 opacity-40" />
                  </div>
                </div>
              </Tooltip>
              {streak > 0 && (
                <Tooltip content={
                  <div>
                    <div className="font-black text-orange-400 mb-1">🔥 {streak}-Day Streak</div>
                    <p>Consecutive fasting days upregulate fat-oxidation enzymes and mitochondrial density. Your streak multiplier is <strong className="text-yellow-300">{streakMultiplier.toFixed(1)}x</strong> — every Mind Point you earn is worth more.</p>
                  </div>
                }>
                  <div className="self-start sm:self-auto text-left sm:text-right cursor-help max-w-full">
                    <div className="text-[0.7rem] font-black text-orange-400 inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 whitespace-nowrap">
                      <Flame className="w-4 h-4 shrink-0" fill="currentColor" /> {streak} DAY STREAK
                    </div>
                    {streak >= 2 && <div className="text-[0.6rem] text-yellow-400 font-bold">{streakMultiplier.toFixed(1)}x multiplier</div>}
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MP_ACTIONS.map(({ icon: Icon, color, points, label, science }) => (
                <Tooltip key={label} content={
                  <div>
                    <div className={`font-black mb-1 ${color==='cyan' ? 'text-cyan-400' : 'text-purple-400'}`}>+{Math.round(points * streakMultiplier)} pts{streak>=2 ? ` (${streakMultiplier.toFixed(1)}x)`:''}</div>
                    <p>{science}</p>
                  </div>
                }>
                  <div className={`bg-[#0f131c]/60 border ${color==='cyan'?'border-cyan-500/20':'border-purple-500/10'} rounded-3xl p-4 flex flex-col items-center gap-2 cursor-help text-center`}>
                    <Icon className={`w-5 h-5 ${color==='cyan'?'text-cyan-400':'text-purple-400'}`} />
                    <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">{label}</span>
                    <button onClick={(e) => { e.stopPropagation(); addMp(points, label); }}
                      className={`w-full ${color==='cyan'?'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-400':'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-400'} border font-black py-2 rounded-xl text-xs transition-all`}>
                      + Mind
                    </button>
                  </div>
                </Tooltip>
              ))}
            </div>

            {/* MP LOG */}
            {mpLog.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setShowMpLog(s => !s)}
                  className="flex items-center gap-1 text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563] hover:text-[#98a4bb] transition-colors">
                  <History className="w-3 h-3" /> Recent Activity
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMpLog ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMpLog && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {mpLog.slice(0, 15).map((entry, i) => {
                          const d = new Date(entry.time);
                          const now = new Date();
                          const isToday = d.toDateString() === now.toDateString();
                          const isYesterday = d.toDateString() === new Date(now.getTime() - 864e5).toDateString();
                          const dateLabel = isToday ? 'Today' : isYesterday ? 'Yest' : `${d.getMonth()+1}/${d.getDate()}`;
                          return (
                            <div key={i} className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[0.55rem] font-bold text-[#4b5563] w-8 shrink-0">{dateLabel}</span>
                                <span className="text-[0.6rem] font-bold text-[#98a4bb] truncate">{entry.label}</span>
                              </div>
                              <span className="text-[0.6rem] font-black text-purple-400 shrink-0 ml-2">+{entry.points}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* HYDRATION */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4">💧 Hydration</h2>
            <div className="grid grid-cols-2 gap-3">
              <Tooltip content={
                <div>
                  <div className="font-black text-cyan-400 mb-1">💧 Water</div>
                  <p>Fasting increases urination and electrolyte loss. Dehydration mimics hunger — many "hunger pangs" at hour 4-8 are actually thirst. Aim for 8+ glasses. Cold water can slightly boost metabolism via thermogenesis.</p>
                  <p className="mt-2 text-purple-300 font-bold">+5 Mind Points per glass logged.</p>
                </div>
              }>
                <div className="bg-black/30 border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-help">
                  <div className="text-2xl">💧</div>
                  <div className="text-3xl font-black text-cyan-400">{waterCount}</div>
                  <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">glasses</div>
                  <button onClick={(e) => { e.stopPropagation(); logWater(); }}
                    className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-black py-2 rounded-xl text-xs transition-all">
                    + Water
                  </button>
                </div>
              </Tooltip>
              <Tooltip content={
                <div>
                  <div className="font-black text-orange-400 mb-1">⚡ Electrolytes</div>
                  <p>Sodium, potassium, and magnesium are lost faster during fasting due to lower insulin (which normally causes retention). Low electrolytes cause "keto flu": headache, fatigue, muscle cramps. Salt your water or use a supplement.</p>
                  <p className="mt-2 text-purple-300 font-bold">+5 Mind Points per serving logged.</p>
                </div>
              }>
                <div className="bg-black/30 border border-orange-500/10 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-help">
                  <div className="text-2xl">⚡</div>
                  <div className="text-3xl font-black text-orange-400">{electrolyteCount}</div>
                  <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">servings</div>
                  <button onClick={(e) => { e.stopPropagation(); logElectrolyte(); }}
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-black py-2 rounded-xl text-xs transition-all">
                    + Electrolytes
                  </button>
                </div>
              </Tooltip>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[0.55rem] font-black uppercase text-[#4b5563] mb-1">
                <span>Daily Goal: 8 glasses</span>
                <span className={waterCount>=8?'text-cyan-400':''}>{waterCount>=8 ? '✓ DONE' : `${8-waterCount} to go`}</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div animate={{ width:`${Math.min(100,(waterCount/8)*100)}%` }} transition={{ duration:0.5 }}
                  className="h-full bg-cyan-500 rounded-full" />
              </div>
            </div>
          </section>

          {/* ACCELERANTS */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <Tooltip content={
              <div>
                <div className="font-black text-cyan-400 mb-1">⚡ Accelerants</div>
                <p className="mb-2">Movement speeds up fasting biology — burning glycogen faster and pushing you toward fat-burning sooner. When adding a custom activity, pick the intensity that matches:</p>
                <p className="text-green-300"><strong>Light (2x):</strong> Walking, yoga, stretching — low heart rate, conversational pace.</p>
                <p className="text-cyan-300"><strong>Moderate (2.5x):</strong> Cycling, swimming, pickleball, hiking — breathing harder but sustainable.</p>
                <p className="text-orange-300"><strong>Intense (3x):</strong> Running, HIIT, basketball, sports — high heart rate, can't hold a conversation.</p>
                <p className="text-purple-300"><strong>Resistance (2.5x):</strong> Lifting, bodyweight, CrossFit — muscle tension, creates glycogen debt.</p>
              </div>
            }>
              <h2 className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4 cursor-help">Accelerants <Info className="w-3 h-3 opacity-40" /></h2>
            </Tooltip>
            <div className="grid grid-cols-2 gap-3">
              {allActivities.map(act => (
                <Tooltip key={act.label} content={
                  <div>
                    <div className="font-black text-cyan-400 mb-1">{act.emoji} {act.label} — {act.multiplier}x</div>
                    <p>{act.science}</p>
                    {act.custom && <button onClick={() => removeCustomActivity(act.label)} className="mt-2 text-[0.6rem] font-bold text-red-400 hover:text-red-300">Remove activity</button>}
                  </div>
                }>
                  <button onClick={() => openActivity(act)}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#98a4bb] hover:text-white">
                    {act.emoji} {act.label.toUpperCase()}
                  </button>
                </Tooltip>
              ))}
              <button onClick={() => setShowAddActivity(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-cyan-500/30 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#4b5563] hover:text-cyan-400">
                <PlusCircle className="w-4 h-4" /> ADD ACTIVITY
              </button>
            </div>
          </section>

          {/* WEIGHT TRACKER */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black flex items-center gap-2">
                <Scale className="w-3 h-3" /> Weight
              </h2>
              {weightLog.length > 0 && (
                <div className={`text-[0.65rem] font-black ${weightDelta !== null && weightDelta < 0 ? 'text-green-400' : weightDelta !== null && weightDelta > 0 ? 'text-red-400' : 'text-[#4b5563]'}`}>
                  {weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lbs` : ''}
                </div>
              )}
            </div>

            {weightLog.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-[0.6rem] text-[#4b5563] font-bold mb-1">
                  <span>{weightValues[0]} lbs</span>
                  <span className="text-white font-black">{lastWeight} lbs</span>
                </div>
                <Sparkline data={weightValues} />
                <div className="text-[0.55rem] text-[#4b5563] text-center mt-1">{weightLog.length} entries · last 30 days</div>
              </div>
            )}

            <AnimatePresence>
              {showWeightInput ? (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  <div className="flex gap-2">
                    <input type="number" placeholder="lbs" value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && logWeight()}
                      className="flex-1 bg-black/40 border border-white/10 text-white font-black rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/50 text-center text-sm"
                      autoFocus />
                    <button onClick={logWeight}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-black px-3 py-2 rounded-xl text-xs">LOG</button>
                    <button onClick={() => setShowWeightInput(false)}
                      className="bg-white/5 text-[#4b5563] font-black px-3 py-2 rounded-xl text-xs">✕</button>
                  </div>
                </motion.div>
              ) : (
                <button onClick={() => setShowWeightInput(true)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-[#98a4bb] hover:text-white font-bold py-3 rounded-2xl text-xs transition-all">
                  + Log Weight
                </button>
              )}
            </AnimatePresence>
          </section>

          {/* FAST HISTORY */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black flex items-center gap-2">
                <Clock className="w-3 h-3 text-purple-500" /> Fast History
              </h2>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button onClick={() => setHistoryView('calendar')}
                  className={`px-2 py-1 rounded-lg text-[0.55rem] font-black transition-all ${historyView==='calendar' ? 'bg-purple-500/20 text-purple-400' : 'text-[#4b5563] hover:text-white'}`}>
                  CAL
                </button>
                <button onClick={() => setHistoryView('list')}
                  className={`px-2 py-1 rounded-lg text-[0.55rem] font-black transition-all ${historyView==='list' ? 'bg-purple-500/20 text-purple-400' : 'text-[#4b5563] hover:text-white'}`}>
                  LIST
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {historyView === 'calendar' ? (
                <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <FastingCalendar history={fastHistory} activityLog={activityLog} mpLog={mpLog} waterLog={waterCount} electrolyteLog={electrolyteCount} />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {fastHistory.length > 0 ? fastHistory.map((record, i) => (
                    <div key={i} className="bg-black/30 rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-white font-black text-sm">{record.hours}h fast</div>
                          <div className="text-[0.55rem] text-[#4b5563]">
                            {new Date(record.end).toLocaleDateString([], {month:'short', day:'numeric'})} · Day {record.streak} streak
                          </div>
                        </div>
                        <div className={`text-xs font-black px-2 py-1 rounded-xl border ${
                          record.hours >= 24 ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                          record.hours >= 18 ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
                          'text-[#4b5563] border-white/5'
                        }`}>
                          {record.hours >= 24 ? '🧬 Deep' : record.hours >= 18 ? '🔥 Ketosis' : '✓ Done'}
                        </div>
                      </div>
                      {record.refeed.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {record.refeed.map((f, j) => (
                            <span key={j} className={`text-[0.55rem] font-black px-2 py-0.5 rounded-full border ${
                              f.quality==='excellent' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                              f.quality==='good' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' :
                              f.quality==='fair' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                              'text-red-400 border-red-500/20 bg-red-500/10'
                            }`}>
                              {f.emoji} {f.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="text-center text-[0.6rem] text-[#4b5563] py-4 italic">No fasts logged yet.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
                          {new Date(entry.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
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

        {/* ── CENTER COLUMN ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 flex flex-col items-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
            <div className="flex items-center justify-between w-full mb-6 z-10">
              <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-[#98a4bb] font-black">
                Metabolic Anatomy <span className="text-cyan-500 ml-2">LIVE</span>
              </h2>
              <div className="text-[0.55rem] font-black uppercase tracking-widest text-cyan-400/80">
                {(startTime || devMode) ? currentPhase.short : ''}
              </div>
            </div>
            {devMode && (
              <div className="w-full z-10 mb-4 space-y-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-[0.5rem] font-black uppercase tracking-widest text-purple-400 whitespace-nowrap">HOURS {devHours}h</span>
                  <input type="range" min={0} max={72} step={0.5} value={devHours} onChange={e => setDevHours(Number(e.target.value))}
                    className="flex-1 h-1 accent-purple-500 cursor-pointer" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.5rem] font-black uppercase tracking-widest text-cyan-400 whitespace-nowrap">VELOCITY {devVelocity.toFixed(1)}x</span>
                  <input type="range" min={1} max={3} step={0.1} value={devVelocity} onChange={e => setDevVelocity(Number(e.target.value))}
                    className="flex-1 h-1 accent-cyan-500 cursor-pointer" />
                </div>
              </div>
            )}
            <div className="relative w-full max-w-[400px] flex justify-center py-6 z-10">
              <img src="/body.png" alt="Anatomy" className="w-full opacity-80 mix-blend-lighten" />

              {/* Scanner line */}
              <AnimatePresence>
                {showScanner && (
                  <motion.div initial={{ top:"0%" }} animate={{ top:"100%" }} exit={{ opacity:0 }}
                    transition={{ duration:2, ease:"easeInOut" }}
                    className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20" />
                )}
              </AnimatePresence>

              {/* ── BRAIN ── ketone-fueled (18h+), brightness scales with MP */}
              {(() => {
                const brainActive = (startTime || devMode) && currentH > 18;
                const mpGlow = Math.min(1, mp / 200);
                const brainOpacity = brainActive ? 0.6 + mpGlow * 0.4 : mpGlow > 0.1 ? mpGlow * 0.3 : 0;
                return brainOpacity > 0 ? (
                  <>
                    {/* Core glow */}
                    <motion.div
                      animate={{ opacity: [brainOpacity * 0.6, brainOpacity, brainOpacity * 0.6], scale: [0.9, 1.15, 0.9] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className={`absolute top-[10%] left-1/2 -translate-x-1/2 ${brainActive ? 'w-20 h-14' : 'w-12 h-8'} bg-purple-500 blur-2xl rounded-full pointer-events-none`}
                    />
                    {/* Outer halo */}
                    {brainActive && (
                      <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1.1, 0.95] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 w-28 h-20 bg-purple-400/40 blur-3xl rounded-full pointer-events-none"
                      />
                    )}
                    {/* Floating ketone particles rising from brain */}
                    {brainActive && [0,1,2,3,4].map(i => (
                      <motion.div key={`bk-${i}`}
                        initial={{ opacity: 0, y: 0, x: 0 }}
                        animate={{ opacity: [0, 0.8, 0], y: -40, x: (i - 2) * 12 }}
                        transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                        className="absolute top-[12%] left-[49%] w-1.5 h-1.5 bg-purple-300 rounded-full pointer-events-none"
                        style={{ filter: 'blur(0.5px)' }}
                      />
                    ))}
                  </>
                ) : null;
              })()}

              {/* ── STOMACH ── digesting (0-4h), fades as digestion ends */}
              {(startTime || devMode) && currentH < 6 && (
                <>
                  <motion.div
                    animate={{ opacity: [Math.max(0.15, 0.6 - currentH * 0.1), Math.max(0.25, 0.8 - currentH * 0.1)], scale: [0.95, 1.08, 0.95] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[37%] left-[48%] -translate-x-1/2 w-14 h-12 bg-green-500 blur-2xl rounded-full pointer-events-none"
                  />
                  {/* Digestion particles swirling */}
                  {[0,1,2].map(i => (
                    <motion.div key={`sg-${i}`}
                      animate={{ opacity: [0, 0.6 - currentH * 0.08, 0], rotate: [0, 360], scale: [0.5, 1, 0.5] }}
                      transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
                      className="absolute top-[39%] left-[47%] w-1 h-1 bg-green-300 rounded-full pointer-events-none"
                      style={{ transformOrigin: `${6 + i * 4}px ${6 + i * 3}px` }}
                    />
                  ))}
                </>
              )}

              {/* ── LIVER ── glycogen depletion (2-18h), peak at 8-12h */}
              {(startTime || devMode) && currentH > 2 && currentH < 24 && (() => {
                const liverIntensity = currentH < 8 ? (currentH - 2) / 6 : currentH < 18 ? 1 : Math.max(0, 1 - (currentH - 18) / 6);
                return (
                  <>
                    <motion.div
                      animate={{ opacity: [liverIntensity * 0.4, liverIntensity * 0.8, liverIntensity * 0.4], scale: [0.93, 1.1, 0.93] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-[29%] left-[55%] -translate-x-1/2 w-16 h-12 bg-cyan-400 blur-2xl rounded-full pointer-events-none"
                    />
                    {/* Glycogen → ketone conversion particles */}
                    {liverIntensity > 0.3 && [0,1,2].map(i => (
                      <motion.div key={`lk-${i}`}
                        animate={{ opacity: [0, liverIntensity * 0.7, 0], x: [0, 15 + i * 5], y: [0, -20 - i * 8] }}
                        transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                        className="absolute top-[31%] left-[54%] w-1.5 h-1.5 bg-cyan-300 rounded-full pointer-events-none"
                        style={{ filter: 'blur(0.5px)' }}
                      />
                    ))}
                  </>
                );
              })()}

              {/* ── FAT ── fat mobilization (12h+), particles drift down from hips/butt */}
              {(startTime || devMode) && currentH > 10 && (() => {
                const fatIntensity = Math.min(1, (currentH - 10) / 14);
                const lateBoost = currentH > 24 ? Math.min(1, (currentH - 24) / 24) : 0;
                const totalFat = Math.min(1, fatIntensity + lateBoost * 0.4);
                // Origins at hips/butt — particles travel diagonally outward
                const origins = [
                  { t: 52, l: 42, dx: -18, dy: 15 },  // left hip → diagonal out-left
                  { t: 52, l: 57, dx: 18,  dy: 15 },  // right hip → diagonal out-right
                  { t: 54, l: 45, dx: -15, dy: 18 },  // left glute → diagonal out-left
                  { t: 54, l: 54, dx: 15,  dy: 18 },  // right glute → diagonal out-right
                  { t: 50, l: 40, dx: -20, dy: 10 },  // left love handle → mostly outward
                  { t: 50, l: 59, dx: 20,  dy: 10 },  // right love handle → mostly outward
                ];
                const particlesPerOrigin = currentH > 36 ? 4 : currentH > 24 ? 3 : 2;
                return (
                  <>
                    {/* Subtle hip glow — lower, at the belt line */}
                    <motion.div
                      animate={{ opacity: [totalFat * 0.15, totalFat * 0.35, totalFat * 0.15], scale: [0.97, 1.04, 0.97] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-[50%] left-1/2 -translate-x-1/2 w-20 h-8 bg-orange-500 blur-2xl rounded-full pointer-events-none"
                    />
                    {/* Fat particles drifting downward from each origin — stays within body */}
                    {origins.map((origin, oi) =>
                      Array.from({ length: particlesPerOrigin }, (_, pi) => (
                        <motion.div key={`fp-${oi}-${pi}`}
                          animate={{
                            opacity: [0, totalFat * 0.7, 0],
                            x: [0, origin.dx + (pi % 2 === 0 ? -2 : 2)],
                            y: [0, origin.dy + pi * 8],
                            scale: [1, 0.3],
                          }}
                          transition={{ duration: 2.2 + pi * 0.4, repeat: Infinity, delay: oi * 0.25 + pi * 0.35, ease: 'easeOut' }}
                          className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full pointer-events-none"
                          style={{ top: `${origin.t}%`, left: `${origin.l}%`, filter: 'blur(0.5px)', boxShadow: '0 0 3px rgba(251,146,60,0.5)' }}
                        />
                      ))
                    )}
                    {/* Thigh glow — appears at 16h+ */}
                    {currentH > 16 && (() => {
                      const thighIntensity = Math.min(1, (currentH - 16) / 20);
                      return (
                        <>
                          <motion.div
                            animate={{ opacity: [thighIntensity * 0.1, thighIntensity * 0.3, thighIntensity * 0.1], scale: [0.96, 1.06, 0.96] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-[60%] left-[42%] -translate-x-1/2 w-8 h-12 bg-orange-500 blur-2xl rounded-full pointer-events-none"
                          />
                          <motion.div
                            animate={{ opacity: [thighIntensity * 0.1, thighIntensity * 0.3, thighIntensity * 0.1], scale: [0.96, 1.06, 0.96] }}
                            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                            className="absolute top-[60%] left-[58%] -translate-x-1/2 w-8 h-12 bg-orange-500 blur-2xl rounded-full pointer-events-none"
                          />
                        </>
                      );
                    })()}
                  </>
                );
              })()}

              {/* ── HEART ── ketone-fueled (24h+), plateaus ~32h — steady not dominant */}
              {(startTime || devMode) && currentH > 20 && (() => {
                const heartIntensity = Math.min(0.6, (currentH - 20) / 20); // caps at 0.6 by ~32h
                const glowSize = 9 + heartIntensity * 3; // 9px → 10.8px — modest growth
                const ringSize = 12 + heartIntensity * 4; // 12px → 14.4px
                return (
                  <>
                    {/* Core heartbeat glow — grows over time */}
                    <motion.div
                      animate={{ opacity: [0.3 + heartIntensity * 0.2, 0.6 + heartIntensity * 0.35, 0.3 + heartIntensity * 0.2], scale: [0.92, 1.12, 0.92] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-[28%] left-[49%] -translate-x-1/2 bg-red-500 blur-lg rounded-full pointer-events-none"
                      style={{ width: glowSize * 4, height: glowSize * 4 }}
                    />
                    {/* Heartbeat pulse ring — grows with it */}
                    <motion.div
                      animate={{ opacity: [0, 0.15 + heartIntensity * 0.2, 0], scale: [0.8, 1.3, 0.8] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-[27.5%] left-[49%] -translate-x-1/2 border border-red-400/30 rounded-full pointer-events-none"
                      style={{ width: ringSize * 4, height: ringSize * 4 }}
                    />
                    {/* Blood flow particles — more at deeper ketosis */}
                    {[0,1,2, ...(heartIntensity > 0.5 ? [3,4] : [])].map(i => (
                      <motion.div key={`hb-${i}`}
                        animate={{ opacity: [0, (0.3 + heartIntensity * 0.4), 0], y: [0, 20 + i * 8], scale: [1, 0.4] }}
                        transition={{ duration: 1.3 + i * 0.3, repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }}
                        className="absolute top-[30%] left-[48%] w-1 h-1 bg-red-300 rounded-full pointer-events-none"
                        style={{ filter: 'blur(0.5px)' }}
                      />
                    ))}
                  </>
                );
              })()}

              {/* ── AUTOPHAGY ── cellular cleanup (24h+), sparkles spread head→toes */}
              {(startTime || devMode) && currentH > 24 && (() => {
                const autoIntensity = Math.min(1, (currentH - 24) / 24);
                // All positions kept within the body silhouette outline
                const corePositions = [
                  // Torso & arms — appear first (24h+)
                  {t:15,l:49},{t:20,l:46},{t:22,l:53},{t:30,l:44},{t:32,l:55},
                  {t:36,l:47},{t:38,l:52},{t:42,l:46},{t:44,l:54},
                ];
                const legPositions = [
                  // Upper legs — appear at ~30h+
                  {t:55,l:44},{t:55,l:55},{t:58,l:43},{t:58,l:56},
                  {t:61,l:44},{t:61,l:55},
                ];
                const lowerPositions = [
                  // Calves — appear at ~36h+
                  {t:66,l:43},{t:66,l:57},{t:70,l:44},{t:70,l:56},
                  {t:73,l:43},{t:73,l:57},
                ];
                const feetPositions = [
                  // Feet/toes — appear at ~42h+, extend low and slightly right
                  {t:78,l:42},{t:78,l:58},{t:81,l:41},{t:81,l:59},
                  {t:84,l:40},{t:84,l:60},{t:87,l:41},{t:87,l:59},
                ];
                let positions = [...corePositions];
                if (currentH > 30) positions = [...positions, ...legPositions];
                if (currentH > 36) positions = [...positions, ...lowerPositions];
                if (currentH > 42) positions = [...positions, ...feetPositions];
                return positions.map((pos, i) => (
                  <motion.div key={`ap-${i}`}
                    animate={{
                      opacity: [0, autoIntensity * 0.85, 0],
                      scale: [0.4, 1.3, 0],
                    }}
                    transition={{ duration: 1.6 + (i % 5) * 0.35, repeat: Infinity, delay: (i * 0.25) % 3, ease: 'easeInOut' }}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full pointer-events-none"
                    style={{ top: `${pos.t}%`, left: `${pos.l}%`, boxShadow: '0 0 6px rgba(253,224,71,0.7)' }}
                  />
                ));
              })()}

              {/* ── ORGAN LABELS ── show which organs are active */}
              {(startTime || devMode) && (
                <>
                  {/* Stomach - Digesting */}
                  {currentH < 6 && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="absolute top-[42%] left-[2%] text-[0.5rem] font-black uppercase tracking-widest text-green-300 bg-green-500/15 px-3 py-1 rounded-full border border-green-400/30 shadow-[0_0_12px_rgba(74,222,128,0.3)] pointer-events-none">
                      Stomach · Digesting
                    </motion.span>
                  )}
                  {/* Brain - Ketones */}
                  <div className="absolute top-[5%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    {currentH > 18 && (
                      <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[0.5rem] font-black uppercase tracking-widest text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                        Brain · Ketones
                      </motion.span>
                    )}
                  </div>
                  {/* Liver - moved down to align with liver glow */}
                  {currentH > 2 && currentH < 24 && (
                    <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="absolute top-[34%] right-[2%] text-[0.5rem] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.3)] pointer-events-none">
                      Liver · {currentH < 12 ? 'Glycogen' : 'Ketogenesis'}
                    </motion.span>
                  )}
                  {/* Fat - Mobilizing */}
                  {currentH > 12 && (
                    <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="absolute top-[50%] right-[2%] text-[0.5rem] font-black uppercase tracking-widest text-orange-300 bg-orange-500/15 px-3 py-1 rounded-full border border-orange-400/30 shadow-[0_0_12px_rgba(249,115,22,0.3)] pointer-events-none">
                      Fat · Mobilizing
                    </motion.span>
                  )}
                  {/* Heart - moved down from top-[22%] to top-[26%] */}
                  {currentH > 24 && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="absolute top-[26%] left-[2%] text-[0.5rem] font-black uppercase tracking-widest text-red-300 bg-red-500/15 px-3 py-1 rounded-full border border-red-400/30 shadow-[0_0_12px_rgba(239,68,68,0.3)] pointer-events-none">
                      Heart · Ketones
                    </motion.span>
                  )}
                  {/* Autophagy label */}
                  {currentH > 24 && (
                    <motion.span initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="absolute top-[68%] left-1/2 -translate-x-1/2 text-[0.5rem] font-black uppercase tracking-widest text-yellow-300 bg-yellow-500/15 px-3 py-1 rounded-full border border-yellow-400/30 shadow-[0_0_12px_rgba(253,224,71,0.3)] pointer-events-none">
                      Autophagy · Cell Cleanup
                    </motion.span>
                  )}
                </>
              )}

              {/* ── PHASE OVERLAY ── */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <motion.div
                  key={startTime ? currentPhase.title : 'idle'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2"
                >
                  {(startTime || devMode) ? (
                    <>
                      <div className="text-[0.55rem] font-black uppercase tracking-widest text-white">{currentPhase.title}</div>
                      <div className="text-[0.45rem] font-bold text-cyan-400">{currentPhase.fuel}</div>
                    </>
                  ) : (
                    <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">Start a fast to activate</div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Milestone pills */}
            <div className="mt-auto w-full pt-6 flex flex-wrap gap-2 justify-center z-10">
              {[12,24,48,72].map(m => (
                <Tooltip key={m} content={
                  <div>
                    <div className="font-black text-cyan-400 mb-1">{m}h Milestone</div>
                    <p>{PHASES.find(p=>p.start<=m && p.end>m)?.science || PHASES[PHASES.length-1].science}</p>
                  </div>
                }>
                  <div className={`px-4 py-2 rounded-full text-[0.6rem] font-black tracking-widest border transition-all cursor-help ${currentH>=m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/20 border-white/5 text-[#4b5563]'}`}>
                    {m}H {currentH>=m?'✓':''}
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* BADGES */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black mb-6 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Badge Collection
            </h2>
            <div ref={shimmerRef} className="grid grid-cols-4 gap-3">
              {BADGES.map(badge => {
                const earned = badgesEarned.includes(badge.id);
                return (
                  <Tooltip key={badge.id} content={
                    <div>
                      <div className={`font-black mb-1 ${earned?'text-yellow-400':'text-[#4b5563]'}`}>{badge.emoji} {badge.name}</div>
                      <p className="mb-2">{badge.desc}</p>
                      <div className="border-t border-white/10 pt-2">
                        <div className="text-[0.6rem] font-black text-cyan-400 mb-1">🔬 The Science</div>
                        <p className="text-[0.65rem]">{badge.science}</p>
                      </div>
                    </div>
                  }>
                    <div onClick={() => { if (earned && !hasGyro) requestGyroPermission(); }}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all cursor-help overflow-hidden ${earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/20 border-white/5 opacity-30'}`}>
                      {earned && <div className={`absolute inset-0 badge-shimmer rounded-2xl ${!hasGyro ? 'badge-shimmer-auto' : ''}`} />}
                      <span className={`text-2xl relative z-10 ${earned?'':'grayscale'}`}>{badge.emoji}</span>
                      <span className={`text-[0.5rem] font-black text-center leading-tight relative z-10 ${earned?'text-yellow-300':'text-[#4b5563]'}`}>{badge.name}</span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            {badgesEarned.length === 0 && (
              <p className="text-center text-[0.65rem] text-[#4b5563] mt-4">Complete your first {goalHours}h fast to unlock your first badge. Hover any badge to learn the science.</p>
            )}
          </section>

          {/* ── REFEED PROTOCOL ── */}
          {(() => {
            const guidance = getRefeedGuidance(devMode ? 24 : currentH);
            const state = devMode ? 'ready' : goalProgress < 75 ? 'locked' : goalProgress < 100 ? 'approaching' : 'ready';
            return (
              <section className={`border rounded-[2.5rem] p-8 transition-all ${state==='ready' ? 'bg-green-500/5 border-green-500/20' : state==='approaching' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                <button
                  onClick={() => setShowRefeedSection(s => !s)}
                  onTouchStart={() => { if (isDev) devLongPressRef.current = setTimeout(() => { setDevMode(d => !d); }, 800); }}
                  onTouchEnd={() => { if (devLongPressRef.current) clearTimeout(devLongPressRef.current); }}
                  onMouseDown={() => { if (isDev) devLongPressRef.current = setTimeout(() => { setDevMode(d => !d); }, 800); }}
                  onMouseUp={() => { if (devLongPressRef.current) clearTimeout(devLongPressRef.current); }}
                  className="w-full flex items-center justify-between mb-0">
                  <h2 className="text-[0.65rem] uppercase tracking-[0.2em] font-black flex items-center gap-2
                    ${state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}">
                    <UtensilsCrossed className={`w-4 h-4 ${state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}`} />
                    <span className={state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}>
                      Refeed Protocol {devMode && <span className="text-[0.5rem] text-purple-400 ml-1">DEV</span>}
                    </span>
                    {state==='locked' && <span className="text-[0.55rem] text-[#4b5563] ml-1">— unlocks at {Math.round(goalHours*0.75)}h</span>}
                    {state==='approaching' && <span className="text-[0.55rem] text-yellow-500 ml-1">— approaching goal</span>}
                    {state==='ready' && !devMode && <span className="text-[0.55rem] text-green-500 ml-1">— READY TO BREAK</span>}
                  </h2>
                  <ChevronDown className={`w-4 h-4 text-[#4b5563] transition-transform ${showRefeedSection?'rotate-180':''}`} />
                </button>

                <AnimatePresence>
                  {showRefeedSection && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }} className="overflow-hidden">
                      <div className="pt-6">

                        {state === 'locked' && (
                          <div className="text-center py-6">
                            <div className="text-4xl mb-3">🔒</div>
                            <p className="text-[#4b5563] text-xs">Complete <span className="text-white font-bold">{Math.round(goalHours*0.75)}h</span> of your fast to unlock personalized refeed guidance.</p>
                            <div className="mt-4 h-1.5 bg-black/40 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1c2333] rounded-full" style={{ width:`${(goalProgress/75)*100}%` }} />
                            </div>
                            <div className="text-[0.6rem] text-[#4b5563] mt-1">{goalProgress.toFixed(0)}% / 75% needed</div>
                          </div>
                        )}

                        {(state === 'approaching' || state === 'ready') && (
                          <>
                            {/* Guidance header */}
                            <div className={`rounded-2xl p-4 mb-4 border ${state==='ready'?'bg-green-500/10 border-green-500/20':'bg-yellow-500/10 border-yellow-500/20'}`}>
                              <div className={`text-xs font-black mb-2 ${state==='ready'?'text-green-400':'text-yellow-400'}`}>{guidance.title}</div>
                              <p className={`text-[0.65rem] font-bold mb-3 ${state==='ready'?'text-green-200':'text-yellow-200'}`}>⚠️ {guidance.urgent}</p>
                              <ul className="space-y-1.5">
                                {guidance.steps.map((step, i) => (
                                  <li key={i} className="text-[0.65rem] text-[#c8d4e8] leading-relaxed">{step}</li>
                                ))}
                              </ul>
                            </div>

                            {/* AI Plate Scanner */}
                            <div className="mb-4">
                              <input ref={plateScanInputRef} type="file" accept="image/*" onChange={handlePlateScan} className="hidden" />
                              <button
                                onClick={() => plateScanInputRef.current?.click()}
                                className="w-full p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-3 group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Camera className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="text-left">
                                  <div className="text-xs font-black text-cyan-400 tracking-tight">SCAN YOUR PLATE</div>
                                  <div className="text-[0.55rem] text-[#6b7280] font-bold">AI-powered refeed safety analysis</div>
                                </div>
                              </button>
                            </div>

                            {/* Food choices */}
                            <div className="mb-4">
                              <div className="text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563] mb-3">
                                {state==='ready' ? '📋 Log your refeed — tap to select' : '👀 Preview your options'}
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {REFEED_FOODS.map(food => (
                                  <Tooltip key={food.label} content={
                                    <div>
                                      <div className="font-black text-white mb-1">{food.emoji} {food.label}</div>
                                      <div className={`text-[0.6rem] font-black uppercase mb-2 ${food.quality==='excellent'?'text-green-400':food.quality==='good'?'text-cyan-400':food.quality==='fair'?'text-yellow-400':'text-red-400'}`}>
                                        Insulin: {food.insulin} · Next fast: {food.nextFastBonus}
                                        {REFEED_MP[food.quality] > 0 && <span className="text-purple-400 ml-1">· +{REFEED_MP[food.quality]} MP</span>}
                                      </div>
                                      <p className="text-[0.65rem] mb-2">{food.science}</p>
                                      <div className="border-t border-white/10 pt-2">
                                        <div className="text-[0.6rem] font-black text-purple-400 mb-1">⚡ Next Fast Impact</div>
                                        <p className="text-[0.65rem]">{food.nextFastImpact}</p>
                                      </div>
                                    </div>
                                  }>
                                    <button
                                      onClick={() => state==='ready' && logRefeed(food)}
                                      className={`w-full p-2.5 rounded-2xl border transition-all text-center
                                        ${refeedLogged.some(f=>f.label===food.label) ? QUALITY_COLORS[food.quality] :
                                          state==='ready' ? 'bg-white/5 border-white/10 hover:'+QUALITY_COLORS[food.quality]+' cursor-pointer' :
                                          'bg-white/[0.02] border-white/5 opacity-50 cursor-default'}`}>
                                      <div className={`transition-transform ${refeedLogged.some(f=>f.label===food.label) ? 'scale-105' : ''}`}>
                                        <div className="text-xl">{food.emoji}</div>
                                        <div className="text-[0.5rem] font-black text-[#98a4bb] leading-tight">{food.label}</div>
                                        <div className={`text-[0.5rem] font-black ${food.nextFastBonus.startsWith('+') ? 'text-green-400' : food.nextFastBonus==='+0h'?'text-cyan-400':'text-red-400'}`}>
                                          {food.nextFastBonus}
                                        </div>
                                      </div>
                                    </button>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>

                            {/* Next fast impact summary */}
                            {refeedLogged.length > 0 && (
                              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4">
                                <div className="text-[0.6rem] font-black uppercase tracking-widest text-purple-400 mb-3">⚡ Impact on Your Next Fast</div>
                                <div className="space-y-3">
                                  {refeedLogged.map(food => (
                                    <div key={food.label}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base">{food.emoji}</span>
                                        <span className="text-white font-black text-xs">{food.label}</span>
                                        <span className={`text-[0.55rem] font-black ml-auto px-2 py-0.5 rounded-full border ${QUALITY_COLORS[food.quality]}`}>
                                          {food.quality}
                                        </span>
                                      </div>
                                      <p className="text-[0.6rem] text-purple-100 leading-relaxed">{food.nextFastImpact}</p>
                                      {refeedLogged.indexOf(food) < refeedLogged.length - 1 && (
                                        <div className="border-t border-purple-500/10 mt-2" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {state==='ready' && (
                              <button onClick={() => setShowEndFastModal(true)}
                                className="w-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                🏁 End Fast & Complete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })()}
        </div>

        {/* ── RIGHT COLUMN: ROADMAP ── */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <Tooltip content={
                <div className="space-y-2">
                  <div className="font-black text-cyan-400 mb-2">Metabolic Velocity</div>
                  <p>Your <span className="text-cyan-400 font-bold">velocity</span> measures how fast you're moving through metabolic phases compared to clock time.</p>
                  <p>Every activity you log adds bonus hours based on its intensity multiplier:</p>
                  <div className="space-y-1 my-2">
                    <div className="flex justify-between text-[0.7rem]"><span>🚶 Walk</span><span className="text-cyan-400 font-bold">2x</span></div>
                    <div className="flex justify-between text-[0.7rem]"><span>🏋️ Lift</span><span className="text-cyan-400 font-bold">2.5x</span></div>
                    <div className="flex justify-between text-[0.7rem]"><span>🏃 Run</span><span className="text-cyan-400 font-bold">3x</span></div>
                  </div>
                  <p>A 30min run at 3x = <span className="text-orange-400 font-bold">+1.5h bonus</span>, compressing your time to the next milestone.</p>
                  <p className="text-[#6b7280]">The <span className="text-orange-400">T-minus</span> countdowns on each phase reflect your current velocity. More activity = faster ETAs.</p>
                </div>
              }>
                <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black flex items-center gap-2 cursor-help">
                  72h Metabolic Roadmap <Info className="w-3 h-3 text-[#4b5563]" />
                </h2>
              </Tooltip>
              <Clock className="w-4 h-4 text-cyan-500/50" />
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {PHASES.map(p => {
                const isCurrent = currentH >= p.start && currentH < p.end;
                const isComplete = currentH >= p.end;
                const eta = getETA(p.start);
                const phaseProgress = isCurrent ? Math.min(100, ((currentH - p.start) / (p.end - p.start)) * 100) : 0;
                return (
                <motion.div key={p.id} whileHover={{ x:5 }} onClick={() => setSelectedPhase(p)}
                  className={`group p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${isCurrent ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}>
                  {isComplete && <div className="absolute top-2 right-2"><CheckCircle2 className="w-3 h-3 text-cyan-400" /></div>}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-md ${isCurrent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-[#4b5563]'}`}>{p.start}-{p.end}H</span>
                    <div className="flex items-center gap-2">
                      {/* Velocity ETA for upcoming phases */}
                      {eta !== null && !isComplete && !isCurrent && (startTime || devMode) && (
                        <span className="text-[0.5rem] font-black tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          T-{formatETA(eta)}
                        </span>
                      )}
                      {isCurrent && velocity > 1.05 && (
                        <span className="text-[0.5rem] font-black tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {velocity.toFixed(1)}x
                        </span>
                      )}
                      <Info className="w-3 h-3 text-[#4b5563] group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                  <h3 className={`text-base font-bold mb-2 tracking-tight ${isCurrent ? 'text-white' : 'text-[#98a4bb]'}`}>{p.title}</h3>
                  <p className="text-[0.7rem] text-[#6b7280] leading-snug line-clamp-2">{p.notes}</p>
                  {/* Phase progress bar for current phase */}
                  {isCurrent && (
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phaseProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
              {/* Next milestone with ETA */}
              {(() => {
                const milestones = [
                  { h: 12, label: 'Fuel Shift' },
                  { h: 18, label: 'Ketosis' },
                  { h: 24, label: 'Deep Ketosis' },
                  { h: 48, label: 'Autophagy Peak' },
                ];
                const next = milestones.find(m => currentH < m.h);
                const eta = next ? getETA(next.h) : null;
                return (
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.65rem] font-black text-[#4b5563] uppercase tracking-widest">Next Milestone</span>
                      <span className="text-xs font-black text-orange-400">
                        {next ? `${next.label} @ ${next.h}h` : 'Extended Fast'}
                      </span>
                    </div>
                    {eta !== null && (startTime || devMode) && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[0.55rem] font-bold text-[#4b5563] uppercase tracking-widest">AI Forecast</span>
                        <span className="text-[0.65rem] font-black text-cyan-400">
                          Est. arrival in {formatETA(eta)}{velocity > 1.05 ? ` (${velocity.toFixed(1)}x velocity)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>
        </div>
      </div>

      {/* PLATE SCAN MODAL */}
      <AnimatePresence>
        {showPlateScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            {/* Close button */}
            <button onClick={() => { setShowPlateScan(false); setScanPhase('idle'); setPlateScanImage(null); setPlateScanResult(null); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image preview with laser scan */}
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {plateScanImage && (
                <img src={plateScanImage} alt="Plate" className="w-full object-cover max-h-[50vh]" />
              )}
              {/* Laser line animation */}
              {scanPhase === 'scanning' && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 w-full h-[3px] bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.9),0_0_60px_rgba(34,211,238,0.4)] z-10"
                />
              )}
              {/* Scanning overlay */}
              {scanPhase === 'scanning' && (
                <div className="absolute inset-0 bg-cyan-500/5 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">Analyzing Metabolic Impact</div>
                    <div className="text-[0.55rem] text-cyan-400/60 mt-1">Gemini 3 Flash · {currentH.toFixed(0)}h fasted</div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Results */}
            {scanPhase === 'done' && plateScanResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mt-6 space-y-3"
              >
                {plateScanResult.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center">
                    <div className="text-red-400 font-black text-sm mb-1">Analysis Failed</div>
                    <div className="text-[0.7rem] text-red-300/70">{plateScanResult.error}</div>
                  </div>
                ) : (
                  <>
                    {/* Grade card */}
                    <div className={`rounded-2xl p-5 border text-center ${
                      plateScanResult.refeed_grade?.startsWith('A') ? 'bg-green-500/10 border-green-500/30' :
                      plateScanResult.refeed_grade?.startsWith('B') ? 'bg-cyan-500/10 border-cyan-500/30' :
                      plateScanResult.refeed_grade?.startsWith('C') ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="text-[0.55rem] font-black uppercase tracking-[0.3em] text-[#6b7280] mb-2">Refeed Safety Grade</div>
                      <div className={`text-5xl font-black ${
                        plateScanResult.refeed_grade?.startsWith('A') ? 'text-green-400' :
                        plateScanResult.refeed_grade?.startsWith('B') ? 'text-cyan-400' :
                        plateScanResult.refeed_grade?.startsWith('C') ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{plateScanResult.refeed_grade}</div>
                      <div className="text-[0.6rem] text-[#98a4bb] mt-1 font-bold">After {currentH.toFixed(0)}h fast</div>
                    </div>

                    {/* Components */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                      <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#6b7280] mb-2">Detected Foods</div>
                      <div className="flex flex-wrap gap-2">
                        {(plateScanResult.estimated_portions || plateScanResult.primary_components || []).map((item: string, i: number) => (
                          <span key={i} className="text-[0.65rem] font-bold text-white bg-white/10 px-3 py-1 rounded-full">{item}</span>
                        ))}
                      </div>
                    </div>

                    {/* Macros */}
                    {plateScanResult.estimated_macros && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                        <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#6b7280] mb-2">Estimated Macros</div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {Object.entries(plateScanResult.estimated_macros).map(([key, val]) => (
                            <div key={key}>
                              <div className="text-sm font-black text-white">{val as string}</div>
                              <div className="text-[0.5rem] font-bold text-[#6b7280] uppercase">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Impact */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                      <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#6b7280] mb-2">Metabolic Impact</div>
                      <p className="text-[0.7rem] text-[#c8d4e8] leading-relaxed">{plateScanResult.metabolic_impact}</p>
                    </div>

                    {/* Warning */}
                    {plateScanResult.safety_warning && plateScanResult.safety_warning !== 'None' && plateScanResult.safety_warning !== 'None.' && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                        <div className="text-[0.55rem] font-black uppercase tracking-widest text-red-400 mb-2">⚠️ Safety Warning</div>
                        <p className="text-[0.7rem] text-red-200 leading-relaxed">{plateScanResult.safety_warning}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {plateScanResult.recommendation && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
                        <div className="text-[0.55rem] font-black uppercase tracking-widest text-cyan-400 mb-2">Recommendation</div>
                        <p className="text-[0.7rem] text-cyan-200 leading-relaxed">{plateScanResult.recommendation}</p>
                      </div>
                    )}

                    {/* Rescan button */}
                    <button
                      onClick={() => { setScanPhase('idle'); setPlateScanImage(null); setPlateScanResult(null); plateScanInputRef.current?.click(); }}
                      className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-black text-[#98a4bb] uppercase tracking-widest"
                    >
                      Scan Another Plate
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNDO MP TOAST */}
      <AnimatePresence>
        {undoMp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#0c1018] border border-purple-500/30 rounded-2xl px-5 py-3 shadow-2xl shadow-black/60"
          >
            <span className="text-sm text-[#c8d4e8] font-bold">+{undoMp.points} MP</span>
            <button onClick={handleUndoMp} className="text-sm font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider">
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
