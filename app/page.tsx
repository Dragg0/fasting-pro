"use client";

import { useEffect, useState, useRef } from "react";
import {
  Brain, History, LogIn, TrendingUp, PlusCircle, CheckCircle2,
  Flame, Zap, Droplets, Info, Clock, LogOut, Loader2, Trophy, Target, Scale, UtensilsCrossed, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// ─── TOOLTIP ────────────────────────────────────────────────────────────────
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-[#0c1018] border border-cyan-500/25 rounded-2xl p-4 z-[300] shadow-2xl shadow-black/60 pointer-events-none">
            <div className="text-xs text-[#c8d4e8] leading-relaxed">{content}</div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0c1018] border-r border-b border-cyan-500/25 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

const ACTIVITIES = [
  { emoji:"🚶", label:"Walk",       multiplier:2,   science:"Walking activates GLUT4 transporters in muscle independently of insulin, draining glycogen stores without spiking cortisol. Each minute of walking = 2 min faster entry into fat-burning." },
  { emoji:"🏃", label:"Run",        multiplier:3,   science:"Running depletes glycogen 3-4x faster than walking via anaerobic glycolysis. The EPOC (excess post-exercise oxygen consumption) effect burns fat for hours after stopping." },
  { emoji:"🏓", label:"Pickleball", multiplier:2.5, science:"Intermittent high-intensity sport. Fast-twitch muscle recruitment burns glycogen rapidly while recovery periods maintain aerobic fat oxidation — a powerful metabolic combination." },
  { emoji:"🏋️", label:"Lift",       multiplier:2.5, science:"Resistance training creates glycogen debt that the body repays from fat stores over 24-48h. mTOR activation from lifting is offset during fasting by elevated AMPK, balancing muscle growth with fat loss." },
];

type Badge = { id: string; emoji: string; name: string; desc: string; threshold: number; type: 'hours'|'streak'|'mp'|'activity'; science: string; };
const BADGES: Badge[] = [
  { id:'ketosis',   emoji:'🔥', name:'Ketosis Club',       desc:'Complete an 18h fast', threshold:18,  type:'hours',    science:'At 18h, blood BHB crosses 0.5 mmol/L — the clinical threshold for nutritional ketosis. Your brain is now running on ketone fuel.' },
  { id:'autophagy', emoji:'🧬', name:'Autophagy Unlocked', desc:'Complete a 24h fast',  threshold:24,  type:'hours',    science:'24h fasting strongly suppresses mTOR and activates AMPK, triggering cellular autophagy — your body\'s cleanup and recycling system.' },
  { id:'marathon',  emoji:'🏆', name:'Marathon Fast',      desc:'Complete a 48h fast',  threshold:48,  type:'hours',    science:'48h fasting triggers stem cell regeneration in the gut lining and immune system. IGF-1 drops 60%, dramatically slowing cell aging pathways.' },
  { id:'streak3',   emoji:'⚡', name:'On a Roll',          desc:'3-day fasting streak', threshold:3,   type:'streak',   science:'After 3 consecutive fasting days, mitochondrial biogenesis upregulates. Your cells are literally building more power plants.' },
  { id:'streak7',   emoji:'📅', name:'Iron Will',          desc:'7-day fasting streak', threshold:7,   type:'streak',   science:'7-day fasters show measurable improvements in insulin sensitivity (HOMA-IR), blood pressure, and inflammatory markers (CRP, IL-6).' },
  { id:'streak30',  emoji:'💎', name:'Diamond Mind',       desc:'30-day fasting streak',threshold:30,  type:'streak',   science:'30-day metabolic adaptation: your fat oxidation enzymes (CPT-1, HADHA) are significantly upregulated. You are now fat-adapted at the enzymatic level.' },
  { id:'century',   emoji:'💯', name:'Century',            desc:'Earn 100 Mind Points', threshold:100, type:'mp',       science:'Behavioral science shows it takes ~21-66 days to form a habit. 100 Mind Points means you\'ve reinforced self-control pathways repeatedly — the neural grooves are forming.' },
  { id:'mover',     emoji:'🏅', name:'Mover',              desc:'Log 5 activity sessions',threshold:5, type:'activity', science:'Exercise during fasting boosts AMPK 2-3x more than either alone. Five sessions means you\'ve compounded the fasting effect significantly.' },
];

const GOAL_OPTIONS = [14, 16, 18, 20, 24, 36, 48];

type RefeedFood = { emoji: string; label: string; quality: 'excellent'|'good'|'fair'|'avoid'; nextFastBonus: string; insulin: string; science: string; nextFastImpact: string; };
const REFEED_FOODS: RefeedFood[] = [
  { emoji:'🍲', label:'Bone Broth',   quality:'excellent', nextFastBonus:'+1-2h',  insulin:'none',     science:'Zero insulin response. Electrolytes, collagen, and gelatin gently prime the gut without triggering digestion enzymes. The gold standard refeed.',                nextFastImpact:'Your electrolytes reset cleanly. Next fast will feel easier to start — hunger is blunted and gut is settled.' },
  { emoji:'🥚', label:'Eggs',         quality:'excellent', nextFastBonus:'+1h',    insulin:'minimal',  science:'High protein, near-zero carb. Minimal insulin response (~2-3 mU/L). Leucine content triggers muscle protein synthesis without refilling glycogen.',          nextFastImpact:'Glycogen stays low. Fat-burning enzymes remain active. Your next fast enters ketosis ~2h faster.' },
  { emoji:'🥑', label:'Avocado',      quality:'excellent', nextFastBonus:'+1h',    insulin:'minimal',  science:'Monounsaturated fat with minimal carbs. Essentially zero insulin response. Provides satiety without disrupting the ketogenic state.',                        nextFastImpact:'Ketones may remain measurable through the night. Next morning fast starts from a fat-adapted baseline.' },
  { emoji:'🍗', label:'Protein',      quality:'good',      nextFastBonus:'+0.5h',  insulin:'moderate', science:'Protein triggers some insulin (via amino acids), but far less than carbs. Glucagon also rises, partially offsetting fat storage. Net effect: muscle is protected, glycogen stays low.', nextFastImpact:'Modest glycogen replenishment. Next fast needs ~1h extra to clear glycogen before entering fat burning.' },
  { emoji:'🥗', label:'Salad',        quality:'good',      nextFastBonus:'+0.5h',  insulin:'low',      science:'Fiber slows any glucose absorption dramatically. Low-calorie density means low insulin. Adding protein or fat dressing improves the response further.',      nextFastImpact:'Gut microbiome gets fiber; next fast morning gut motility is better. Mild glycogen refill only.' },
  { emoji:'🍌', label:'Fruit',        quality:'fair',      nextFastBonus:'-0.5h',  insulin:'moderate', science:'Fructose is processed by the liver (not muscles), which can partially refill liver glycogen — the exact store your fast depleted. Insulin spike is moderate.', nextFastImpact:'Liver glycogen partially refilled. Next fast takes 1-2h longer to reach fat-burning phase.' },
  { emoji:'🍚', label:'Rice/Carbs',   quality:'fair',      nextFastBonus:'-1h',    insulin:'high',     science:'High-glycemic carbs spike insulin strongly (~60-80 mU/L). Muscle and liver glycogen refill rapidly. Fat oxidation is suppressed for 3-4h post-meal.',      nextFastImpact:'Full glycogen reload. Next fast requires 4-6h longer to work through glycogen before fat burning begins.' },
  { emoji:'🍕', label:'Full Meal',    quality:'avoid',     nextFastBonus:'-2h',    insulin:'very high',science:'Mixed macros create a large, sustained insulin response. Glycogen fills completely, triglycerides rise. All fat-burning mechanisms fully suppressed for 4-6h.',  nextFastImpact:'Complete metabolic reset. Next fast essentially starts from zero — no residual fat-adapted benefit carries over.' },
  { emoji:'🍫', label:'Sugar',        quality:'avoid',     nextFastBonus:'-3h',    insulin:'extreme',  science:'Pure glucose/fructose — maximal insulin spike. Dopamine surge creates cravings within hours. This is the worst possible refeed choice after a meaningful fast.', nextFastImpact:'Worst outcome: insulin spike triggers fat storage, glycogen overfills, and cravings make starting the next fast significantly harder.' },
];

const QUALITY_COLORS: Record<string, string> = {
  excellent: 'border-green-500/40 bg-green-500/10 text-green-300',
  good:      'border-cyan-500/30  bg-cyan-500/10  text-cyan-300',
  fair:      'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  avoid:     'border-red-500/30   bg-red-500/10   text-red-300',
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
  { icon: Brain,    color: 'purple', points: 10, label: 'No Late Snack',    science: 'Late-night eating disrupts circadian insulin rhythms. A strict 10pm cutoff extends your overnight fast by 1-2h and improves morning cortisol response, boosting fat mobilization.' },
  { icon: Zap,      color: 'cyan',   points: 20, label: 'Walk vs Lunch',    science: 'Walking instead of eating during lunch keeps insulin suppressed, maintains ketone production, and activates GLUT4 in muscles. Studies show a 20-min walk reduces post-meal glucose by 30%.' },
  { icon: PlusCircle, color: 'purple', points: 15, label: 'Refused Treat', science: 'Each successful act of food refusal strengthens the prefrontal cortex\'s inhibitory control pathways. You are literally rewiring your brain toward discipline with every "no".' },
  { icon: Droplets, color: 'purple', points: 5,  label: 'AM/PM Discipline',science: 'Morning cortisol (peaks 8-9am) naturally mobilizes fat stores. Fasting during this window amplifies the effect. Evening discipline prevents the insulin spike that shuts down overnight fat burning.' },
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
  const [refeedLogged, setRefeedLogged] = useState<RefeedFood | null>(null);
  const [showRefeedSection, setShowRefeedSection] = useState(true);
  const [showEndFastModal, setShowEndFastModal] = useState(false);

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
      setWaterCount(data.water_count || 0);
      setElectrolyteCount(data.electrolyte_count || 0);
      const earned = data.badges_earned ? JSON.parse(data.badges_earned) : [];
      setBadgesEarned(earned);
      if (data.activity_log) { try { setActivityLog(JSON.parse(data.activity_log)); } catch {} }
      if (data.weight_log)   { try { setWeightLog(JSON.parse(data.weight_log)); } catch {} }
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

  const checkAndAwardBadges = (maxH: number, str: number, totalMp: number, actCount: number, current: string[]) => {
    const next = [...current];
    let newest: Badge | null = null;
    for (const b of BADGES) {
      if (next.includes(b.id)) continue;
      const ok = (b.type==='hours' && maxH>=b.threshold) || (b.type==='streak' && str>=b.threshold) ||
                 (b.type==='mp' && totalMp>=b.threshold) || (b.type==='activity' && actCount>=b.threshold);
      if (ok) { next.push(b.id); newest = b; }
    }
    if (next.length !== current.length) {
      setBadgesEarned(next);
      if (newest) setShowBadgeCelebration(newest);
      if (session) supabase.from('profiles').update({ badges_earned: JSON.stringify(next) }).eq('id', session!.user.id);
    }
    return next;
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
      const { error } = await supabase.from('profiles').update({
        mind_points: payload.fastData?.mindPoints || 0,
        fast_start_time: payload.start || null,
        accelerant_minutes: payload.fastData?.accelerantMinutes || 0,
        updated_at: new Date().toISOString(),
      }).eq('id', session.user.id);
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
    if (session) await supabase.from('profiles').update({
      fast_start_time: chosen.toISOString(), accelerant_minutes: 0,
      activity_log: '[]', water_count: 0, electrolyte_count: 0,
    }).eq('id', session.user.id);
  };

  const openActivity = (act: typeof ACTIVITIES[0]) => {
    setSelectedActivity(act); setActivityMinutes(30); setShowActivityModal(true);
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
    if (session) await supabase.from('profiles').update({
      accelerant_minutes: newAccelTotal, activity_log: JSON.stringify(newLog),
      activity_count: newActCount, badges_earned: JSON.stringify(newBadges),
    }).eq('id', session.user.id);
  };

  const logWater = async () => {
    const n = waterCount + 1; setWaterCount(n);
    if (session) await supabase.from('profiles').update({ water_count: n }).eq('id', session.user.id);
  };

  const logElectrolyte = async () => {
    const n = electrolyteCount + 1; setElectrolyteCount(n);
    if (session) await supabase.from('profiles').update({ electrolyte_count: n }).eq('id', session.user.id);
  };

  const logWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 50 || w > 500) return;
    const entry = { weight: w, ts: new Date().toISOString() };
    const newLog = [...weightLog, entry].slice(-30); // keep last 30
    setWeightLog(newLog); setWeightInput(""); setShowWeightInput(false);
    if (session) await supabase.from('profiles').update({ weight_log: JSON.stringify(newLog) }).eq('id', session.user.id);
  };

  const triggerScan = () => { setShowScanner(true); setTimeout(() => setShowScanner(false), 2000); };

  const logRefeed = async (food: RefeedFood) => {
    setRefeedLogged(food);
    if (session) await supabase.from('profiles').update({ last_refeed: food.label }).eq('id', session.user.id);
  };

  const endFast = async () => {
    // Award streak point and save completed fast
    const newStreak = streak + 1;
    const completedH = currentH;
    const newMax = Math.max(maxHoursEver, completedH);
    setStreak(newStreak);
    setMaxHoursEver(newMax);
    const newBadges = checkAndAwardBadges(newMax, newStreak, totalMpEver, activityCount, badgesEarned);
    setShowEndFastModal(false);
    // Reset fast state
    setStartTime(null); setElapsed(0); setBonus(0); setAccelerantMinutes(0);
    setActivityLog([]); setWaterCount(0); setElectrolyteCount(0); setRefeedLogged(null);
    goalReachedRef.current = false;
    if (session) await supabase.from('profiles').update({
      streak: newStreak, max_hours_ever: newMax, fast_start_time: null,
      accelerant_minutes: 0, activity_log: '[]', water_count: 0, electrolyte_count: 0,
      badges_earned: JSON.stringify(newBadges),
    }).eq('id', session.user.id);
  };

  const streakMultiplier = Math.min(3, 1 + streak * 0.1);

  const addMp = async (base: number) => {
    const points = Math.round(base * streakMultiplier);
    const newMp = mp + points, newTotal = totalMpEver + points;
    setMp(newMp); setTotalMpEver(newTotal);
    const newBadges = checkAndAwardBadges(maxHoursEver, streak, newTotal, activityCount, badgesEarned);
    if (session) await supabase.from('profiles').update({
      mind_points: newMp, total_mp_ever: newTotal, badges_earned: JSON.stringify(newBadges),
    }).eq('id', session.user.id);
  };

  if (!mounted) return null;

  const currentH = elapsed + bonus;
  const currentPhase = PHASES.find(p => currentH >= p.start && currentH < p.end) || PHASES[PHASES.length - 1];
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
              {!refeedLogged && <p className="text-yellow-400 text-xs mb-6 font-bold">💡 Tip: Log your refeed below before ending for best tracking.</p>}
              {refeedLogged && <p className="text-green-400 text-xs mb-6 font-bold">✓ Refeed logged: {refeedLogged.emoji} {refeedLogged.label}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowEndFastModal(false)}
                  className="flex-1 bg-white/5 border border-white/10 text-[#98a4bb] font-bold py-4 rounded-2xl">KEEP GOING</button>
                <button onClick={endFast}
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
          <h1 className="text-6xl md:text-7xl font-[900] tracking-tighter text-white uppercase italic">FALLOW</h1>
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
            <button onClick={handleAuth}
              className="bg-[#151a26] hover:bg-[#1c2333] border border-white/10 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 text-white">
              <LogIn className="w-5 h-5 text-cyan-400" /> {loading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
            </button>
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
          <section className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
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
                        if (session) supabase.from('profiles').update({ fast_goal_hours: h }).eq('id', session.user.id); }}
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
            <div className="flex justify-between items-start mb-6">
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
                  <div className="text-right cursor-help">
                    <div className="text-[0.7rem] font-black text-orange-400 flex items-center gap-1">
                      <Flame className="w-4 h-4" fill="currentColor" /> {streak} DAY STREAK
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
                  <button onClick={() => addMp(points)}
                    className={`group w-full flex flex-col items-center justify-center gap-2 bg-[#0f131c]/60 border ${color==='cyan'?'border-cyan-500/20 hover:border-cyan-500/40':'border-purple-500/10 hover:border-purple-500/40'} p-4 rounded-3xl transition-all text-center`}>
                    <Icon className={`w-5 h-5 ${color==='cyan'?'text-cyan-400':'text-purple-400'} group-hover:scale-110 transition-transform`} />
                    <span className="text-[0.6rem] font-black uppercase tracking-tighter text-[#98a4bb]">{label}</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          </section>

          {/* HYDRATION */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4">💧 Hydration</h2>
            <div className="grid grid-cols-2 gap-3">
              <Tooltip content={
                <div>
                  <div className="font-black text-cyan-400 mb-1">💧 Water</div>
                  <p>Fasting increases urination and electrolyte loss. Dehydration mimics hunger — many "hunger pangs" at hour 4-8 are actually thirst. Aim for 8+ glasses. Cold water can slightly boost metabolism via thermogenesis.</p>
                </div>
              }>
                <div className="bg-black/30 border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-help">
                  <div className="text-2xl">💧</div>
                  <div className="text-3xl font-black text-cyan-400">{waterCount}</div>
                  <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">glasses</div>
                  <button onClick={logWater}
                    className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-black py-2 rounded-xl text-xs transition-all">
                    + Water
                  </button>
                </div>
              </Tooltip>
              <Tooltip content={
                <div>
                  <div className="font-black text-orange-400 mb-1">⚡ Electrolytes</div>
                  <p>Sodium, potassium, and magnesium are lost faster during fasting due to lower insulin (which normally causes retention). Low electrolytes cause "keto flu": headache, fatigue, muscle cramps. Salt your water or use a supplement.</p>
                </div>
              }>
                <div className="bg-black/30 border border-orange-500/10 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-help">
                  <div className="text-2xl">⚡</div>
                  <div className="text-3xl font-black text-orange-400">{electrolyteCount}</div>
                  <div className="text-[0.55rem] font-black uppercase tracking-widest text-[#4b5563]">servings</div>
                  <button onClick={logElectrolyte}
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
            <h2 className="text-[0.65rem] uppercase tracking-widest text-[#4b5563] font-black mb-4">Accelerants</h2>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map(act => (
                <Tooltip key={act.label} content={
                  <div>
                    <div className="font-black text-cyan-400 mb-1">{act.emoji} {act.label} — {act.multiplier}x</div>
                    <p>{act.science}</p>
                  </div>
                }>
                  <button onClick={() => openActivity(act)}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[0.65rem] font-bold transition-all text-[#98a4bb] hover:text-white">
                    {act.emoji} {act.label.toUpperCase()}
                  </button>
                </Tooltip>
              ))}
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
            <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-[#98a4bb] font-black mb-10 self-start z-10">
              Metabolic Anatomy <span className="text-cyan-500 ml-2">LIVE</span>
            </h2>
            <div className="relative w-full max-w-[400px] flex justify-center py-10 z-10">
              <img src="/body.png" alt="Anatomy" className="w-full opacity-80 mix-blend-lighten" />
              <AnimatePresence>
                {showScanner && (
                  <motion.div initial={{ top:"0%" }} animate={{ top:"100%" }} exit={{ opacity:0 }}
                    transition={{ duration:2, ease:"easeInOut" }}
                    className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20" />
                )}
              </AnimatePresence>
              <div className={`absolute top-[13%] left-1/2 -translate-x-1/2 w-10 h-6 bg-purple-500/40 blur-lg rounded-full transition-opacity duration-1000 ${currentH>18?'opacity-100':'opacity-0'}`} />
              <div className={`absolute top-[31%] left-[56%] -translate-x-1/2 w-12 h-8 bg-cyan-400/40 blur-xl rounded-full transition-opacity duration-1000 ${currentH<12?'opacity-100':'opacity-0'}`} />
            </div>
            <div className="mt-auto w-full pt-10 flex flex-wrap gap-2 justify-center z-10">
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
            <div className="grid grid-cols-4 gap-3">
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
                    <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all cursor-help ${earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/20 border-white/5 opacity-30'}`}>
                      <span className={`text-2xl ${earned?'':'grayscale'}`}>{badge.emoji}</span>
                      <span className={`text-[0.5rem] font-black text-center leading-tight ${earned?'text-yellow-300':'text-[#4b5563]'}`}>{badge.name}</span>
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
            const guidance = getRefeedGuidance(currentH);
            const state = goalProgress < 75 ? 'locked' : goalProgress < 100 ? 'approaching' : 'ready';
            return (
              <section className={`border rounded-[2.5rem] p-8 transition-all ${state==='ready' ? 'bg-green-500/5 border-green-500/20' : state==='approaching' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                <button onClick={() => setShowRefeedSection(s => !s)}
                  className="w-full flex items-center justify-between mb-0">
                  <h2 className="text-[0.65rem] uppercase tracking-[0.2em] font-black flex items-center gap-2
                    ${state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}">
                    <UtensilsCrossed className={`w-4 h-4 ${state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}`} />
                    <span className={state==='ready'?'text-green-400':state==='approaching'?'text-yellow-400':'text-[#4b5563]'}>
                      Refeed Protocol
                    </span>
                    {state==='locked' && <span className="text-[0.55rem] text-[#4b5563] ml-1">— unlocks at {Math.round(goalHours*0.75)}h</span>}
                    {state==='approaching' && <span className="text-[0.55rem] text-yellow-500 ml-1">— approaching goal</span>}
                    {state==='ready' && <span className="text-[0.55rem] text-green-500 ml-1">— READY TO BREAK</span>}
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

                            {/* Food choices */}
                            <div className="mb-4">
                              <div className="text-[0.6rem] font-black uppercase tracking-widest text-[#4b5563] mb-3">
                                {state==='ready' ? '📋 Log your refeed — tap to select' : '👀 Preview your options'}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {REFEED_FOODS.map(food => (
                                  <Tooltip key={food.label} content={
                                    <div>
                                      <div className="font-black text-white mb-1">{food.emoji} {food.label}</div>
                                      <div className={`text-[0.6rem] font-black uppercase mb-2 ${food.quality==='excellent'?'text-green-400':food.quality==='good'?'text-cyan-400':food.quality==='fair'?'text-yellow-400':'text-red-400'}`}>
                                        Insulin: {food.insulin} · Next fast: {food.nextFastBonus}
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
                                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all
                                        ${refeedLogged?.label===food.label ? QUALITY_COLORS[food.quality]+' scale-105 shadow-lg' :
                                          state==='ready' ? 'bg-white/5 border-white/10 hover:'+QUALITY_COLORS[food.quality]+' cursor-pointer' :
                                          'bg-white/[0.02] border-white/5 opacity-50 cursor-default'}`}>
                                      <span className="text-2xl">{food.emoji}</span>
                                      <div className="text-left">
                                        <div className="text-[0.7rem] font-black text-white leading-tight">{food.label}</div>
                                        <span className={`text-[0.55rem] font-black ${food.nextFastBonus.startsWith('+') ? 'text-green-400' : food.nextFastBonus==='+0h'?'text-cyan-400':'text-red-400'}`}>
                                          {food.nextFastBonus} to next fast
                                        </span>
                                      </div>
                                      <div className={`ml-auto text-xs font-black px-2 py-0.5 rounded-full border text-center ${food.quality==='excellent'?'text-green-400 border-green-500/30':food.quality==='good'?'text-cyan-400 border-cyan-500/30':food.quality==='fair'?'text-yellow-400 border-yellow-500/30':'text-red-400 border-red-500/30'}`}>
                                        {food.quality.slice(0,1).toUpperCase()}
                                      </div>
                                    </button>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>

                            {/* Next fast impact summary */}
                            {refeedLogged && (
                              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4">
                                <div className="text-[0.6rem] font-black uppercase tracking-widest text-purple-400 mb-2">⚡ Impact on Your Next Fast</div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">{refeedLogged.emoji}</span>
                                  <span className="text-white font-black text-sm">{refeedLogged.label}</span>
                                  <span className={`text-xs font-black ml-auto px-2 py-0.5 rounded-full border ${QUALITY_COLORS[refeedLogged.quality]}`}>
                                    {refeedLogged.quality}
                                  </span>
                                </div>
                                <p className="text-[0.65rem] text-purple-100 leading-relaxed">{refeedLogged.nextFastImpact}</p>
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
              <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#98a4bb] font-black">72h Metabolic Roadmap</h2>
              <Clock className="w-4 h-4 text-cyan-500/50" />
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {PHASES.map(p => (
                <motion.div key={p.id} whileHover={{ x:5 }} onClick={() => setSelectedPhase(p)}
                  className={`group p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${currentH>=p.start && currentH<p.end ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}>
                  {currentH>=p.end && <div className="absolute top-2 right-2"><CheckCircle2 className="w-3 h-3 text-cyan-400" /></div>}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-md ${currentH>=p.start && currentH<p.end ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-[#4b5563]'}`}>{p.start}-{p.end}H</span>
                    <Info className="w-3 h-3 text-[#4b5563] group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className={`text-base font-bold mb-2 tracking-tight ${currentH>=p.start && currentH<p.end ? 'text-white' : 'text-[#98a4bb]'}`}>{p.title}</h3>
                  <p className="text-[0.7rem] text-[#6b7280] leading-snug line-clamp-2">{p.notes}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[0.65rem] font-black text-[#4b5563] uppercase tracking-widest">Next Milestone</span>
                <span className="text-xs font-black text-orange-400">
                  {currentH<12 ? 'Fuel Shift @ 12h' : currentH<18 ? 'Ketosis @ 18h' : currentH<24 ? 'Deep Ketosis @ 24h' : currentH<48 ? 'Autophagy @ 48h' : 'Extended Fast'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
