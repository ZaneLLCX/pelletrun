import { create } from 'zustand';

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  PAUSED = 'PAUSED'
}

export enum GameTheme {
  FUTURISTIC = 'FUTURISTIC',
  HELL = 'HELL',
  BLUE = 'BLUE',
  HAUNTED = 'HAUNTED'
}

export enum MonsterState {
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  IDLE = 'IDLE',
  SEARCH = 'SEARCH'
}

interface GameState {
  status: GameStatus;
  totalPellets: number;
  collectedPellets: number;
  stamina: number;
  isSprinting: boolean;
  monsterState: MonsterState;
  monsterDistance: number;
  isMonsterCharging: boolean;
  isTrackerActive: boolean;
  isMoving: boolean;
  isGlitching: boolean;
  isExhausted: boolean;
  isChatOpen: boolean;
  lastMessage: string | null;
  gameId: number;
  theme: GameTheme;
  
  setStatus: (status: GameStatus) => void;
  setTheme: (theme: GameTheme) => void;
  setTotalPellets: (count: number) => void;
  collectPellet: () => void;
  setStamina: (value: number) => void;
  setSprinting: (isSprinting: boolean) => void;
  setMonsterState: (state: MonsterState) => void;
  setMonsterDistance: (dist: number) => void;
  setIsMonsterCharging: (charging: boolean) => void;
  setTrackerActive: (active: boolean) => void;
  setIsMoving: (isMoving: boolean) => void;
  setIsGlitching: (isGlitching: boolean) => void;
  setIsExhausted: (isExhausted: boolean) => void;
  setChatOpen: (open: boolean) => void;
  sendMessage: (msg: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: GameStatus.START,
  totalPellets: 0,
  collectedPellets: 0,
  stamina: 100,
  isSprinting: false,
  monsterState: MonsterState.PATROL,
  monsterDistance: 100,
  isMonsterCharging: false,
  isTrackerActive: false,
  isMoving: false,
  isGlitching: false,
  isExhausted: false,
  isChatOpen: false,
  lastMessage: null,
  gameId: 0,
  theme: GameTheme.FUTURISTIC,

  setStatus: (status) => set({ status }),
  setTheme: (theme) => set({ theme }),
  setTotalPellets: (totalPellets) => set({ totalPellets, collectedPellets: 0 }),
  collectPellet: () => set((state) => ({ collectedPellets: Math.min(state.collectedPellets + 1, state.totalPellets) })),
  setStamina: (stamina) => set({ stamina }),
  setSprinting: (isSprinting) => set({ isSprinting }),
  setMonsterState: (monsterState) => set({ monsterState }),
  setMonsterDistance: (monsterDistance) => set({ monsterDistance }),
  setIsMonsterCharging: (isMonsterCharging) => set({ isMonsterCharging }),
  setTrackerActive: (isTrackerActive: boolean) => set({ isTrackerActive }),
  setIsMoving: (isMoving: boolean) => set({ isMoving }),
  setIsGlitching: (isGlitching: boolean) => set({ isGlitching }),
  setIsExhausted: (isExhausted: boolean) => set({ isExhausted }),
  setChatOpen: (isChatOpen: boolean) => set({ isChatOpen }),
  sendMessage: (lastMessage: string) => set({ lastMessage: lastMessage + " " + Math.random() }), // Add random to trigger useEffect
  resetGame: () => set((state) => ({
    status: GameStatus.PLAYING,
    collectedPellets: 0,
    stamina: 100,
    isSprinting: false,
    monsterState: MonsterState.PATROL,
    isMonsterCharging: false,
    isTrackerActive: false,
    isMoving: false,
    isGlitching: false,
    isExhausted: false,
    isChatOpen: false,
    lastMessage: null,
    gameId: state.gameId + 1
  })),
}));
