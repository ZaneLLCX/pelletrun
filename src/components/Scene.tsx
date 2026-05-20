import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Maze } from './Maze';
import { Player } from './Player';
import { Monster } from './Monster';
import { Pellets } from './Pellets';
import { Bodies } from './Bodies';
import { useGameStore, GameStatus, GameTheme } from '../hooks/useGameStore';
import { generateMaze } from '../utils/mazeGenerator';
import { MAZE_SIZE } from '../constants';
import { EffectComposer, Pixelation, Vignette, Bloom, Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';

export function Scene() {
  const status = useGameStore((state) => state.status);
  const theme = useGameStore((state) => state.theme);
  const setIsGlitching = useGameStore((state) => state.setIsGlitching);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Use a stable maze for each session
  const maze = useMemo(() => generateMaze(MAZE_SIZE), []);

  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    let timeout: any;
    const scheduleGlitch = () => {
      const delay = Math.random() * (30000 - 15000) + 15000; // 15-30 seconds
      timeout = setTimeout(() => {
        setGlitchActive(true);
        setIsGlitching(true);
        // Turn off after a short burst
        setTimeout(() => {
          setGlitchActive(false);
          setIsGlitching(false);
          scheduleGlitch();
        }, Math.random() * 500 + 200); // 200-700ms glitch duration
      }, delay);
    };

    scheduleGlitch();
    return () => {
      clearTimeout(timeout);
      setIsGlitching(false);
    };
  }, [status, setIsGlitching]);

  const atmosphere = useMemo(() => {
    switch(theme) {
        case GameTheme.HELL:
            return { fog: '#3b0a0a', ambient: 0.6 };
        case GameTheme.BLUE:
            return { fog: '#050a15', ambient: 0.4 };
        case GameTheme.HAUNTED:
            return { fog: '#121212', ambient: 0.3 };
        default:
            return { fog: '#000', ambient: 1.2 };
    }
  }, [theme]);

  if (status === GameStatus.START) return null;

  return (
    <>
      <ambientLight intensity={atmosphere.ambient} />
      <color attach="background" args={['#000']} />
      <fog attach="fog" args={[atmosphere.fog, 0, 25]} />

      <Maze maze={maze} />
      <Pellets maze={maze} />
      <Bodies maze={maze} />
      <Monster maze={maze} />
      <Player maze={maze} />

      <EffectComposer>
        <Pixelation granularity={5} />
        <Bloom 
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <Vignette eskil={false} offset={0.5} darkness={0.8} />
        {glitchActive && (
          <Glitch 
            delay={new THREE.Vector2(0, 0)} 
            duration={new THREE.Vector2(0.2, 0.4)} 
            strength={new THREE.Vector2(0.3, 0.5)} 
            mode={GlitchMode.CONSTANT_WILD}
            active
          />
        )}
      </EffectComposer>
    </>
  );
}
