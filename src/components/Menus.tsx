import React from 'react';
import { useGameStore, GameStatus, GameTheme } from '../hooks/useGameStore';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Skull, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export function MainMenu() {
  const setStatus = useGameStore((state) => state.setStatus);

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center p-4 overflow-hidden font-mono translate-z-0">
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-12 z-10"
      >
        <div className="text-center space-y-4">
          <h1 className="text-7xl md:text-9xl font-pixel text-retro-green tracking-tighter retro-glow-green crt-flicker">
            PELLET_<span className="text-retro-amber">RUN</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-retro-green/30" />
            <p className="text-retro-green/50 uppercase tracking-[0.4em] text-[10px] font-bold">SYSTEM_RECOVERY_PROTOCOL_v0.9.7</p>
            <span className="h-px w-12 bg-retro-green/30" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-black/80 p-8 border-2 border-retro-green/20 shadow-[0_0_20px_rgba(0,255,65,0.05)] space-y-6">
            <div className="space-y-4">
              <h3 className="text-retro-green font-bold uppercase tracking-widest border-b border-retro-green/20 pb-2 text-xs">// MISSION_DIRECTIVES</h3>
              <p className="text-retro-green/70 text-sm leading-relaxed">
                STATUS: <span className="text-retro-amber animate-pulse">TRAPPED</span> IN_ARCADE_DIMENSION_42.
                OBJECTIVE: COLLECT ALL <span className="text-retro-amber font-bold">BIO_PELLETS</span> TO RESTORE SYSTEM POWER.
                THREAT_LEVEL: <span className="text-red-500 font-bold uppercase">CRITICAL</span>.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-retro-green font-bold uppercase tracking-widest border-b border-retro-green/20 pb-2 text-xs">// CONTROL_MAPPING</h3>
              <ul className="text-retro-green/50 text-[10px] uppercase font-bold tracking-[0.1em] space-y-2 font-mono">
                <li>[W][A][S][D] - NAVIGATION</li>
                <li>[SHIFT] - ENGAGE_SPRINT (STAMINA_COST: HIGH)</li>
                <li>[STATUS] - AVOID_LINE_OF_SIGHT_WITH_CHOMP</li>
                <li>[WARNING] - RED_LIGHTS_INDICATE_PROXIMITY</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <button 
              onClick={() => setStatus(GameStatus.PLAYING)}
              className="group relative w-full py-6 bg-retro-green text-black font-black text-2xl tracking-widest uppercase active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)]"
            >
              <div className="absolute inset-0 bg-retro-amber translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                INITIALIZE_BOOT <Play size={24} fill="currentColor" />
              </span>
            </button>

            <div className="text-center p-4 border border-retro-green/10 bg-retro-green/5">
              <p className="text-[10px] text-retro-green/40 leading-tight uppercase font-pixel tracking-widest">
                CAUTION: SYSTEM EXPOSURE MAY CAUSE HEIGHTENED HEART RATE AND PARANOIA. 
                USE AT OWN RISK.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function WinScreen() {
  const resetGame = useGameStore((state) => state.resetGame);

  React.useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff41', '#ffb000', '#00f3ff']
    });
  }, []);

  return (
    <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-4 font-mono crt-flicker">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-10"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-black border-4 border-retro-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.6)]">
            <Trophy className="text-retro-cyan" size={48} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-6xl font-pixel text-retro-cyan tracking-tighter uppercase retro-glow-cyan">ESCAPE_SUCCESS</h2>
          <div className="bg-retro-cyan/10 p-4 border border-retro-cyan/30">
            <p className="text-retro-cyan/70 text-xs uppercase tracking-[0.2em] font-bold">
              SYS_LOG: ALL_PELLETS_CONSUMED. GRID_DE-MATERIALIZING. YOU_HAVE_TRANSCENDED_THE_ARCADE.
            </p>
          </div>
        </div>

        <button 
          onClick={resetGame}
          className="w-full py-5 bg-retro-cyan text-black font-black text-xl tracking-widest uppercase hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95"
        >
          RELIVE_NIGHTMARE <RotateCcw size={24} />
        </button>
      </motion.div>
    </div>
  );
}

function BloodSplatter() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Large splatters - pixelated rectangles */}
        <rect x="0" y="0" width="12" height="15" fill="#880000" />
        <rect x="12" y="0" width="8" height="8" fill="#660000" />
        <rect x="0" y="15" width="4" height="12" fill="#880000" />
        
        <rect x="88" y="0" width="12" height="25" fill="#880000" />
        <rect x="84" y="25" width="4" height="8" fill="#660000" />
        
        <rect x="35" y="85" width="25" height="15" fill="#880000" />
        <rect x="30" y="92" width="8" height="4" fill="#660000" />

        {/* Scattered "pixels" */}
        <rect x="8" y="35" width="2" height="2" fill="#880000" />
        <rect x="65" y="15" width="2" height="2" fill="#660000" />
        <rect x="22" y="70" width="2" height="2" fill="#880000" />
        <rect x="92" y="55" width="3" height="3" fill="#660000" />
        <rect x="4" y="80" width="2" height="2" fill="#880000" />
        
        {/* Pixelated Drips */}
        <rect x="10" y="15" width="2" height="12" fill="#880000" />
        <rect x="88" y="25" width="2" height="20" fill="#880000" />
        <rect x="40" y="75" width="2" height="8" fill="#660000" />
      </svg>
    </div>
  );
}

export function LoseScreen() {
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center p-4 font-mono">
      <div className="absolute inset-0 bg-red-950/30 crt-flicker pointer-events-none z-0" />
      <BloodSplatter />

       <motion.div 
         initial={{ scale: 2, opacity: 1 }}
         animate={{ scale: 1, opacity: 0 }}
         transition={{ duration: 0.5, ease: "easeOut" }}
         className="absolute inset-0 bg-red-600 flex items-center justify-center pointer-events-none z-50"
       >
          <div className="text-black font-pixel text-[15vw] tracking-tighter uppercase">SYSTEM_FATAL_ERROR</div>
       </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-md w-full text-center space-y-12 z-10"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-black border-4 border-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.7)] group">
            <Skull className="text-red-600 group-hover:scale-110 transition-transform" size={48} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-6xl font-pixel text-red-600 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">USER_TERMINATED</h2>
          <div className="bg-red-950/40 p-4 border border-red-600/30">
            <p className="text-red-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
              [ERROR]: BIOMETRIC_SIGNAL_LOST. THE_CHOMP_HAS_PROCESSED_THE_LAST_VALID_INPUT.
            </p>
          </div>
        </div>

        <button 
          onClick={resetGame}
          className="w-full py-5 bg-red-600 text-white font-black text-xl tracking-widest uppercase hover:bg-black hover:text-red-600 border-2 border-red-600 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95"
        >
          RESTORE_USER_DATA <RotateCcw size={24} />
        </button>
      </motion.div>
    </div>
  );
}

export function PauseMenu() {
  const setStatus = useGameStore((state) => state.setStatus);
  const theme = useGameStore((state) => state.theme);
  const setTheme = useGameStore((state) => state.setTheme);

  const themes = [
    { id: GameTheme.FUTURISTIC, name: 'FUTURISTIC', color: '#00ff41' },
    { id: GameTheme.HELL, name: 'HELL', color: '#dc2626' },
    { id: GameTheme.BLUE, name: 'BLUE_VOID', color: '#2563eb' },
    { id: GameTheme.HAUNTED, name: 'HAUNTED_HOUSE', color: '#404040' },
  ];

  const themeStyles = {
    [GameTheme.FUTURISTIC]: {
      text: 'text-retro-green',
      border: 'border-retro-green/50',
      shadow: 'shadow-[0_0_50px_rgba(0,255,65,0.2)]',
      glow: 'retro-glow-green',
      btn: 'bg-retro-green',
      active: 'bg-retro-green text-black border-retro-green shadow-[0_0_15px_rgba(0,255,65,0.4)]',
      inactive: 'bg-black text-retro-green border-retro-green/30 hover:border-retro-green/80'
    },
    [GameTheme.HELL]: {
      text: 'text-red-600',
      border: 'border-red-600/50',
      shadow: 'shadow-[0_0_50px_rgba(220,38,38,0.2)]',
      glow: 'drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]',
      btn: 'bg-red-600',
      active: 'bg-red-600 text-black border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]',
      inactive: 'bg-black text-red-600 border-red-600/30 hover:border-red-600/80'
    },
    [GameTheme.BLUE]: {
      text: 'text-blue-600',
      border: 'border-blue-600/50',
      shadow: 'shadow-[0_0_50px_rgba(37,99,235,0.2)]',
      glow: 'drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]',
      btn: 'bg-blue-600',
      active: 'bg-blue-600 text-black border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]',
      inactive: 'bg-black text-blue-600 border-blue-600/30 hover:border-blue-600/80'
    },
    [GameTheme.HAUNTED]: {
      text: 'text-neutral-400',
      border: 'border-neutral-400/50',
      shadow: 'shadow-[0_0_50px_rgba(163,163,163,0.2)]',
      glow: 'drop-shadow-[0_0_10px_rgba(163,163,163,0.5)]',
      btn: 'bg-neutral-600',
      active: 'bg-neutral-400 text-black border-neutral-400 shadow-[0_0_15px_rgba(163,163,163,0.4)]',
      inactive: 'bg-black text-neutral-400 border-neutral-400/30 hover:border-neutral-400/80'
    }
  };

  const style = themeStyles[theme] || themeStyles[GameTheme.FUTURISTIC];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono z-[100]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full bg-black border-2 ${style.border} p-8 space-y-8 ${style.shadow}`}
      >
        <div className={`text-center space-y-2 border-b ${style.border.split('/')[0]}/20 pb-4`}>
          <h2 className={`text-4xl font-pixel ${style.text} tracking-widest uppercase ${style.glow}`}>SYSTEM_PAUSED</h2>
          <p className={`${style.text}/40 text-[10px] uppercase font-bold tracking-[0.2em]`}>CONFIG_RECALIBRATION_REQUIRED</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className={`${style.text} font-bold uppercase tracking-widest text-xs`}>// SELECT_ENVIRONMENT_OVERRIDE</h3>
            <div className="grid grid-cols-1 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-between px-4 py-3 border transition-all ${
                    theme === t.id 
                    ? style.active 
                    : style.inactive
                  }`}
                >
                  <span className="font-bold uppercase tracking-tight">{t.name}</span>
                  <div className="w-4 h-4 border-2 border-current" style={{ backgroundColor: theme === t.id ? t.color : 'transparent' }} />
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setStatus(GameStatus.PLAYING)}
            className={`w-full py-4 ${style.btn} text-black font-black text-xl tracking-widest uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(255,176,0,0.3)] active:scale-95`}
          >
            RESUME_PROGRAM
          </button>
        </div>

        <div className="text-center">
            <p className={`${style.text}/30 text-[9px] uppercase tracking-[0.3em]`}>ENCRYPTION_STABLE_v1.3</p>
        </div>
      </motion.div>
    </div>
  );
}
