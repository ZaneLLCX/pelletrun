import React, { useEffect, useState } from 'react';
import { useGameStore, GameStatus, GameTheme } from '../hooks/useGameStore';
import { Trophy, Ghost, Play, RotateCcw, Crosshair } from 'lucide-react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { MAZE_SIZE, CELL_SIZE } from '../constants';

function Radar() {
  const isTrackerActive = useGameStore((state) => state.isTrackerActive);
  const theme = useGameStore((state) => state.theme);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [monsterPos, setMonsterPos] = useState({ x: 0, z: 0 });
  const [revealMonster, setRevealMonster] = useState(false);
  const [activePelletIds, setActivePelletIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const p = (window as any).playerPosition as THREE.Vector3;
      const m = (window as any).monsterPosition as THREE.Vector3;
      const ap = (window as any).activePellets as Set<string>;
      
      if (p) setPlayerPos({ x: p.x, z: p.z });
      if (m) setMonsterPos({ x: m.x, z: m.z });
      if (ap) setActivePelletIds(new Set(ap));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Monster brief reveal every 20s
  useEffect(() => {
    const revealInterval = setInterval(() => {
      setRevealMonster(true);
      setTimeout(() => setRevealMonster(false), 2000); // reveal for 2 seconds
    }, 20000);
    return () => clearInterval(revealInterval);
  }, []);

  const worldToMap = (val: number) => {
    const range = MAZE_SIZE * CELL_SIZE;
    return ((val + range / 2) / range) * 100;
  };

  const pelletLocations = (window as any).pelletLocations || [];

  const themeConfig = {
    [GameTheme.FUTURISTIC]: {
      main: 'rgba(0, 255, 65, 0.5)',
      glow: 'rgba(0, 255, 65, 0.3)',
      bg: 'bg-retro-green',
      text: 'text-retro-green',
      border: 'border-retro-green',
      glowColor: 'rgba(0, 255, 65, 0.3)',
      shadow: 'shadow-[0_0_15px_rgba(0,255,65,0.3)]',
      dot: 'bg-retro-green'
    },
    [GameTheme.HELL]: {
      main: 'rgba(220, 38, 38, 0.5)',
      glow: 'rgba(220, 38, 38, 0.3)',
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-600',
      glowColor: 'rgba(220, 38, 38, 0.3)',
      shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.3)]',
      dot: 'bg-red-600'
    },
    [GameTheme.BLUE]: {
      main: 'rgba(37, 99, 235, 0.5)',
      glow: 'rgba(37, 99, 235, 0.3)',
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      glowColor: 'rgba(37, 99, 235, 0.3)',
      shadow: 'shadow-[0_0_15px_rgba(37, 99, 235,0.3)]',
      dot: 'bg-blue-600'
    },
    [GameTheme.HAUNTED]: {
      main: 'rgba(163, 163, 163, 0.5)',
      glow: 'rgba(163, 163, 163, 0.3)',
      bg: 'bg-neutral-400',
      text: 'text-neutral-400',
      border: 'border-neutral-400',
      glowColor: 'rgba(163, 163, 163, 0.3)',
      shadow: 'shadow-[0_0_15px_rgba(163,163,163,0.3)]',
      dot: 'bg-neutral-400'
    }
  };

  const currentTheme = themeConfig[theme as keyof typeof themeConfig] || themeConfig[GameTheme.FUTURISTIC];

  return (
    <div className={`relative w-32 h-32 bg-black/80 backdrop-blur-md border-2 ${currentTheme.border}/50 overflow-hidden ${currentTheme.shadow}`}>
      {/* Sonar Sweep */}
      <motion.div 
        className={`absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-${currentTheme.bg.split('-')[1]}-${currentTheme.bg.split('-')[2] || '600'}/20 to-transparent origin-bottom`}
        style={{ 
          backgroundColor: currentTheme.glow,
          width: '200%', height: '200%', left: '-50%', top: '-50%' 
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: `linear-gradient(${currentTheme.main} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.main} 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
      
      {/* Pellets */}
      {pelletLocations.map((p: any) => activePelletIds.has(p.id) && (
        <div 
          key={p.id}
          className={`absolute w-1 h-1 ${currentTheme.dot} opacity-40 rounded-full -translate-x-1/2 -translate-y-1/2`}
          style={{ left: `${worldToMap(p.pos[0])}%`, top: `${worldToMap(p.pos[2])}%` }}
        />
      ))}

      {/* Player Dot */}
      <div 
        className="absolute w-2 h-2 bg-retro-cyan rounded-full shadow-[0_0_8px_rgba(0,243,255,1)] -translate-x-1/2 -translate-y-1/2 transition-all duration-100 z-10"
        style={{ left: `${worldToMap(playerPos.x)}%`, top: `${worldToMap(playerPos.z)}%` }}
      />

      {/* Monster Dot (if tracker active or brief reveal) */}
      {(isTrackerActive || revealMonster) && (
        <motion.div 
          animate={{ scale: [1, 2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="absolute w-2 h-2 bg-retro-amber rounded-full shadow-[0_0_8px_rgba(255,176,0,1)] -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${worldToMap(monsterPos.x)}%`, top: `${worldToMap(monsterPos.z)}%` }}
        />
      )}
    </div>
  );
}

function HelmetOverlay() {
  const theme = useGameStore((state) => state.theme);
  
  const themeColors = {
    [GameTheme.FUTURISTIC]: 'rgba(0, 255, 65, 0.1)',
    [GameTheme.HELL]: 'rgba(220, 38, 38, 0.1)',
    [GameTheme.BLUE]: 'rgba(37, 99, 235, 0.1)',
    [GameTheme.HAUNTED]: 'rgba(163, 163, 163, 0.1)'
  };
  const color = themeColors[theme] || themeColors[GameTheme.FUTURISTIC];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden crt-flicker">
      {/* The Heavy Helmet Frame */}
      <div 
        className="absolute inset-[-10px] border-[50px] md:border-[100px] border-neutral-950 opacity-100 shadow-[0_0_100px_rgba(0,0,0,1)]"
        style={{ borderRadius: '15%' }}
      />
      
      {/* Inner Rim Highlight */}
      <div 
        className="absolute inset-[40px] md:inset-[90px] border-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.1)]"
        style={{ borderRadius: '14%', borderColor: color }}
      />

      {/* Retro HUD Corner Brackets */}
      <div className="absolute top-[120px] left-[120px] w-8 h-8 border-t-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute top-[120px] right-[120px] w-8 h-8 border-t-2 border-r-2" style={{ borderColor: color }} />
      <div className="absolute bottom-[160px] left-[120px] w-8 h-8 border-b-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute bottom-[160px] right-[120px] w-8 h-8 border-b-2 border-r-2" style={{ borderColor: color }} />

      {/* Glass Surface Details */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[25%] left-[25%] w-[20%] h-px bg-white/40 blur-[1px] -rotate-45" />
        <div className="absolute bottom-[30%] right-[20%] w-[30%] h-px bg-white/20 blur-[2px] rotate-12" />
      </div>

      {/* Condensation (Subtle dots) */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)',
             WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)'
           }} 
      />

      {/* HUD Scanlines (Simulating electronic display) */}
      <div className="absolute inset-0 opacity-[0.12]" 
           style={{ 
             backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,65,0.05) 3px)',
             backgroundSize: '100% 4px'
           }} 
      />
    </div>
  );
}

export function HUD() {
  const status = useGameStore((state) => state.status);
  const theme = useGameStore((state) => state.theme);
  const stamina = useGameStore((state) => state.stamina);
  const collected = useGameStore((state) => state.collectedPellets);
  const total = useGameStore((state) => state.totalPellets);
  const isCharging = useGameStore((state) => state.isMonsterCharging);
  const isTrackerActive = useGameStore((state) => state.isTrackerActive);
  const isExhausted = useGameStore((state) => state.isExhausted);
  const monsterDist = useGameStore((state) => state.monsterDistance);

  if (status !== GameStatus.PLAYING) return null;

  const themeStyles = {
    [GameTheme.FUTURISTIC]: {
      text: 'text-retro-green',
      border: 'border-retro-green/30',
      glow: 'shadow-[0_0_20px_rgba(0,255,65,0.2)]',
      progress: 'bg-retro-green',
      pulse: 'bg-retro-green',
      glowText: 'retro-glow-green'
    },
    [GameTheme.HELL]: {
      text: 'text-red-600',
      border: 'border-red-600/30',
      glow: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
      progress: 'bg-red-600',
      pulse: 'bg-red-600',
      glowText: 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]'
    },
    [GameTheme.BLUE]: {
      text: 'text-blue-500',
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      progress: 'bg-blue-500',
      pulse: 'bg-blue-500',
      glowText: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
    },
    [GameTheme.HAUNTED]: {
      text: 'text-neutral-400',
      border: 'border-neutral-400/30',
      glow: 'shadow-[0_0_20px_rgba(163,163,163,0.2)]',
      progress: 'bg-neutral-400',
      pulse: 'bg-neutral-200',
      glowText: 'drop-shadow-[0_0_8px_rgba(163,163,163,0.8)]'
    }
  };

  const style = themeStyles[theme] || themeStyles[GameTheme.FUTURISTIC];

  // Calculate proximity percentage: 0% at 25m+, 100% at 0m
  const proximity = Math.max(0, Math.min(100, (1 - monsterDist / 25) * 100));

  return (
    <>
      <HelmetOverlay />
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between z-10 font-mono">
      <div className="flex justify-between items-start">
        <div className={`bg-black/80 border-2 ${style.border.split('/')[0]} px-6 py-3 ${style.glow}`}>
          <div className={`${style.text}/70 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2 ${style.glowText}`}>
            <Ghost size={14} className={`${style.text} animate-pulse`} /> PELLETS_SYNC
          </div>
          <div className={`text-4xl font-pixel font-bold ${style.text} tracking-tighter ${style.glowText}`}>
            {collected} <span className="opacity-20">/</span> {total}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <Radar />
          {/* Proximity Bar */}
          <div className="w-32 flex flex-col gap-1">
             <div className={`flex justify-between text-[8px] font-bold ${style.text}/50 uppercase tracking-widest px-1`}>
               <span>PROXIMITY</span>
               <span className={proximity > 80 ? "text-retro-amber animate-pulse" : ""}>{proximity > 0 ? "DETECTED" : "CLEAR"}</span>
             </div>
             <div className={`h-2 w-full bg-black border ${style.border} overflow-hidden shadow-[0_0_5px_rgba(0,0,0,0.1)]`}>
               <motion.div 
                 className={`h-full ${proximity > 80 ? 'bg-retro-amber' : style.progress}`}
                 animate={{ width: `${proximity}%` }}
                 transition={{ type: 'spring', damping: 15 }}
               />
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center">
         {isCharging && (
           <motion.div 
             animate={{ opacity: [0.4, 1, 0.4] }}
             transition={{ repeat: Infinity, duration: 0.3 }}
             className="text-red-500 font-black text-6xl tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,0,0,1)] font-pixel"
           >
             WARNING: IMPACT IMMINENT
           </motion.div>
         )}

         {isTrackerActive && !isCharging && (
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className={`${style.text} text-xs font-bold tracking-[0.4em] uppercase bg-black border-2 ${style.border} px-4 py-1 ${style.glowText} ${style.glow} crt-flicker`}
           >
             TRACKER_ACTIVE
           </motion.div>
         )}
        
        <div className="w-full max-w-sm flex flex-col gap-2">
          <div className={`flex justify-between text-[10px] font-bold ${style.text}/60 uppercase tracking-[0.2em] px-1`}>
             <span>SYSTEM_STAMINA_LEVEL</span>
             <span className={isExhausted ? "text-retro-amber" : style.text}>{Math.round(stamina)}%</span>
          </div>
          <div className={`h-3 w-full bg-black border-2 ${style.border} overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
            <motion.div 
              className={`h-full ${style.glow} ${isExhausted ? 'bg-retro-amber' : style.progress}`}
              animate={{ width: `${Math.round(stamina)}%` }}
              transition={{ type: 'tween', duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Red Warning Overlay */}
      {isCharging && (
        <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
      )}
    </div>
    </>
  );
}
