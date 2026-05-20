import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { HUD } from './UI';
import { AudioEngine } from './AudioEngine';
import { useGameStore, GameStatus } from '../hooks/useGameStore';
import { MainMenu, WinScreen, LoseScreen, PauseMenu } from './Menus';
import { Chat } from './Chat';

export function Game() {
  const status = useGameStore((state) => state.status);
  const setStatus = useGameStore((state) => state.setStatus);
  const isChatOpen = useGameStore((state) => state.isChatOpen);
  const gameId = useGameStore((state) => state.gameId);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status === GameStatus.PLAYING && !isChatOpen) {
          setStatus(GameStatus.PAUSED);
        } else if (status === GameStatus.PAUSED) {
          setStatus(GameStatus.PLAYING);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isChatOpen, setStatus]);

  return (
    <div className="relative w-full h-full">
      <AudioEngine />
      
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.7, 0] }}
        gl={{ antialias: true }}
      >
        <Scene key={gameId} />
      </Canvas>

      <HUD />
      <Chat />

      {status === GameStatus.START && <MainMenu />}
      {status === GameStatus.WON && <WinScreen />}
      {status === GameStatus.LOST && <LoseScreen />}
      {status === GameStatus.PAUSED && <PauseMenu />}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-1 h-1 bg-white rounded-full opacity-50" />
      </div>
    </div>
  );
}
