import React, { useState, useEffect, useCallback } from "react";
import {
  Coins, Users, Crosshair, Heart, Play, RotateCcw, Trophy,
  Plus, Minus, ChevronRight, Award
} from "lucide-react";
import WSSPhase3, { MarketLoadout, RunResult, EMPTY_LOADOUT } from "./WSSPhase3";

type GradeType = "S" | "A" | "B" | "C" | "D" | "F";
type Phase = "market" | "running" | "results";

interface MetaState {
  currency: number;
  runCount: number;
  bestGrade: GradeType | null;
  lastResult: RunResult | null;
  loadout: MarketLoadout;
}

const STORAGE_KEY = "wss2_meta_v1";

const GRADE_RANK: Record<GradeType, number> = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
const GRADE_COLORS: Record<GradeType, string> = {
  S: "#ffd700", A: "#00ff88", B: "#44aaff",
  C: "#ffaa00", D: "#ff6644", F: "#ff2222",
};

const DEFAULT_META: MetaState = {
  currency: 0,
  runCount: 0,
  bestGrade: null,
  lastResult: null,
  loadout: { ...EMPTY_LOADOUT },
};

interface CatalogItem {
  key: keyof MarketLoadout;
  label: string;
  description: string;
  cost: number;
  max: number;
  icon: React.ReactNode;
  accent: string;
}

const CATALOG: CatalogItem[] = [
  {
    key: "extraSurvivors",
    label: "Extra Survivor",
    description: "+1 survivor spawns at the rift portal next run.",
    cost: 60, max: 2,
    icon: <Users className="w-5 h-5" />,
    accent: "border-green-600 bg-green-900/20 text-green-200",
  },
  {
    key: "startingPistols",
    label: "Pistol Cache",
    description: "A pistol drops near the spawn — first to grab it equips it.",
    cost: 40, max: 2,
    icon: <Crosshair className="w-5 h-5" />,
    accent: "border-yellow-600 bg-yellow-900/20 text-yellow-200",
  },
  {
    key: "startingShotguns",
    label: "Shotgun Cache",
    description: "A shotgun drops near the spawn. Heavy hitter for close range.",
    cost: 100, max: 1,
    icon: <Crosshair className="w-5 h-5" />,
    accent: "border-orange-600 bg-orange-900/20 text-orange-200",
  },
  {
    key: "startingMeds",
    label: "Medkit",
    description: "+1 high-value health pack drops near the spawn (50 HP).",
    cost: 25, max: 3,
    icon: <Heart className="w-5 h-5" />,
    accent: "border-red-600 bg-red-900/20 text-red-200",
  },
];

function clampLoadout(l: MarketLoadout): MarketLoadout {
  const clamped: MarketLoadout = { ...EMPTY_LOADOUT };
  for (const item of CATALOG) {
    const v = Number(l[item.key]) || 0;
    clamped[item.key] = Math.max(0, Math.min(item.max, Math.floor(v)));
  }
  return clamped;
}

function loadMeta(): MetaState {
  if (typeof window === "undefined") return { ...DEFAULT_META };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    return {
      currency: Math.max(0, Math.floor(Number(parsed.currency) || 0)),
      runCount: Math.max(0, Math.floor(Number(parsed.runCount) || 0)),
      bestGrade: parsed.bestGrade ?? null,
      lastResult: parsed.lastResult ?? null,
      loadout: clampLoadout({ ...EMPTY_LOADOUT, ...(parsed.loadout ?? {}) }),
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

function saveMeta(m: MetaState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {}
}

const WSS2MetaShell: React.FC = () => {
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [phase, setPhase] = useState<Phase>("market");

  useEffect(() => { saveMeta(meta); }, [meta]);

  const handleBuy = (item: CatalogItem) => {
    setMeta(m => {
      const owned = m.loadout[item.key];
      if (owned >= item.max) return m;
      if (m.currency < item.cost) return m;
      return {
        ...m,
        currency: m.currency - item.cost,
        loadout: { ...m.loadout, [item.key]: owned + 1 },
      };
    });
  };

  const handleStartRun = () => {
    setPhase("running");
  };

  const handleRunComplete = useCallback((result: RunResult) => {
    setMeta(m => {
      const newBest =
        m.bestGrade === null || GRADE_RANK[result.grade] > GRADE_RANK[m.bestGrade]
          ? result.grade : m.bestGrade;
      return {
        currency: m.currency + result.scrapEarned,
        runCount: m.runCount + 1,
        bestGrade: newBest,
        lastResult: result,
        loadout: { ...EMPTY_LOADOUT },
      };
    });
    setPhase("results");
  }, []);

  const handleContinueToMarket = () => setPhase("market");

  const handleHardReset = () => {
    if (typeof window !== "undefined" && !window.confirm("Reset all meta progress? This clears scrap, run count, and best grade.")) return;
    setMeta({ ...DEFAULT_META });
    setPhase("market");
  };

  if (phase === "running") {
    return <WSSPhase3 loadout={meta.loadout} onRunComplete={handleRunComplete} />;
  }

  if (phase === "results" && meta.lastResult) {
    return <ResultsScreen result={meta.lastResult} onContinue={handleContinueToMarket} />;
  }

  return (
    <MarketScreen
      meta={meta}
      onBuy={handleBuy}
      onStart={handleStartRun}
      onHardReset={handleHardReset}
    />
  );
};

interface MarketScreenProps {
  meta: MetaState;
  onBuy: (item: CatalogItem) => void;
  onStart: () => void;
  onHardReset: () => void;
}

const MarketScreen: React.FC<MarketScreenProps> = ({ meta, onBuy, onStart, onHardReset }) => {
  const totalSpent = CATALOG.reduce((sum, item) => sum + meta.loadout[item.key] * item.cost, 0);
  const ownedAny = CATALOG.some(item => meta.loadout[item.key] > 0);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">
      <div className="shrink-0 bg-gradient-to-b from-red-950/60 to-gray-900 border-b border-red-900/50 px-6 py-3">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <div>
            <div className="text-red-400 font-bold text-sm tracking-widest">A FORGOTTEN PLACE</div>
            <div className="text-gray-500 text-xs">Survivor Market — between-run loadout</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700 rounded px-3 py-1.5">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-lg" data-testid="text-balance">{meta.currency}</span>
            <span className="text-yellow-600 text-xs">scrap</span>
          </div>
          <div className="flex flex-col items-end text-xs">
            <span className="text-gray-500">Run #{meta.runCount + 1}</span>
            {meta.bestGrade && (
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" style={{ color: GRADE_COLORS[meta.bestGrade] }} />
                <span className="text-gray-500">Best:</span>
                <span className="font-bold" style={{ color: GRADE_COLORS[meta.bestGrade] }}>{meta.bestGrade}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Catalog</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {CATALOG.map(item => {
                const owned = meta.loadout[item.key];
                const atMax = owned >= item.max;
                const canAfford = meta.currency >= item.cost;
                const disabled = atMax || !canAfford;
                return (
                  <div key={item.key} className={`rounded-lg border-2 p-4 ${item.accent} ${disabled ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {item.icon}
                      <div className="font-bold">{item.label}</div>
                      <div className="ml-auto text-xs bg-black/40 rounded px-1.5 py-0.5">
                        {owned}/{item.max}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-3 leading-snug min-h-[2.5em]">
                      {item.description}
                    </div>
                    <button
                      onClick={() => onBuy(item)}
                      disabled={disabled}
                      data-testid={`button-buy-${item.key}`}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-bold border transition-colors ${
                        disabled
                          ? "border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "border-yellow-600 bg-yellow-900/30 text-yellow-200 hover:bg-yellow-900/50"
                      }`}
                    >
                      {atMax ? "MAX" : !canAfford ? "Not enough scrap" : (
                        <>
                          <Plus className="w-3 h-3" />
                          Buy <Coins className="w-3 h-3" /> {item.cost}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Loadout for next run</div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
              {ownedAny ? (
                <div className="space-y-2 mb-4" data-testid="loadout-summary">
                  {CATALOG.map(item => {
                    const count = meta.loadout[item.key];
                    if (count === 0) return null;
                    return (
                      <div key={item.key} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{item.icon}</span>
                        <span className="text-gray-200 flex-1">{item.label}</span>
                        <span className="text-gray-400 font-bold">×{count}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-700 pt-2 mt-2 flex items-center text-xs">
                    <span className="text-gray-500">Spent:</span>
                    <span className="ml-auto text-yellow-400 font-bold">{totalSpent} scrap</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-sm text-center py-4 mb-4 italic">
                  Empty loadout — start with the basics or buy gear above.
                </div>
              )}
              <button
                onClick={onStart}
                data-testid="button-start-run"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-green-900 hover:bg-green-800 border-2 border-green-500 text-green-100 font-bold tracking-wider transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Run
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-center text-gray-600 text-xs mt-2">
                Earn scrap from kills, evacuations, and final grade.
              </div>
            </div>

            {meta.lastResult && (
              <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-xs">
                <div className="text-gray-500 uppercase tracking-wider mb-2">Last Run</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" style={{ color: GRADE_COLORS[meta.lastResult.grade] }}>
                    {meta.lastResult.grade}
                  </span>
                  <div className="flex-1 text-gray-400">
                    <div>{meta.lastResult.kills} kills · {meta.lastResult.evacuated}/{meta.lastResult.totalSurvivors} evac</div>
                    <div className="text-yellow-400">+{meta.lastResult.scrapEarned} scrap</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onHardReset}
              className="mt-3 w-full flex items-center justify-center gap-1 text-gray-600 hover:text-gray-400 text-xs py-2"
            >
              <RotateCcw className="w-3 h-3" /> Reset all progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResultsScreenProps { result: RunResult; onContinue: () => void; }

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onContinue }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden items-center justify-center px-6">
      <div className="max-w-md w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            {result.win ? "Run Complete" : "Run Failed"}
          </div>
          <div className="text-7xl font-bold mb-1" style={{ color: GRADE_COLORS[result.grade] }} data-testid="text-grade">
            {result.grade}
          </div>
          <div className="text-gray-400 text-sm">
            {result.kills} kills · {result.evacuated}/{result.totalSurvivors} evacuated · {result.score.toLocaleString()} pts
          </div>
        </div>

        <div className="bg-gray-950 rounded p-4 mb-6 space-y-1.5 text-sm">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <Coins className="w-3 h-3 text-yellow-400" /> Scrap Earned
          </div>
          <Row label={`Score base (score ÷ 10)`} value={result.scrapBreakdown.base} />
          <Row label={`Per kill (${result.kills} × 1)`} value={result.scrapBreakdown.perKill} />
          <Row label={`Per evac (${result.evacuated} × 15)`} value={result.scrapBreakdown.perEvac} />
          <Row label={`Grade bonus (${result.grade})`} value={result.scrapBreakdown.gradeBonus} />
          <div className="border-t border-gray-700 pt-2 mt-2 flex items-center">
            <span className="text-gray-300 font-bold">Total</span>
            <span className="ml-auto text-yellow-300 font-bold text-xl flex items-center gap-1" data-testid="text-scrap-earned">
              <Coins className="w-4 h-4" /> +{result.scrapEarned}
            </span>
          </div>
        </div>

        <button
          onClick={onContinue}
          data-testid="button-continue-to-market"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-yellow-900 hover:bg-yellow-800 border-2 border-yellow-600 text-yellow-100 font-bold tracking-wider transition-colors"
        >
          Continue to Market <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center text-gray-400">
    <span>{label}</span>
    <span className="ml-auto text-gray-200 font-bold">{value >= 0 ? `+${value}` : value}</span>
  </div>
);

export default WSS2MetaShell;
