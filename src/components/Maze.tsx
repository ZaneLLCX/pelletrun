import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { MazeCell, MAZE_SIZE, CELL_SIZE, WALL_HEIGHT } from '../constants';
import { useGameStore, GameTheme } from '../hooks/useGameStore';

interface MazeProps {
  maze: MazeCell[][];
}

export function Maze({ maze }: MazeProps) {
  const wallCount = useMemo(() => {
    let count = 0;
    maze.forEach(row => row.forEach(cell => { if (cell === 'wall') count++; }));
    return count;
  }, [maze]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Store wall positions for color updates
  const wallPositions = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 'wall') {
          pos.push(new THREE.Vector3(
            (x - MAZE_SIZE / 2 + 0.5) * CELL_SIZE,
            WALL_HEIGHT / 2,
            (y - MAZE_SIZE / 2 + 0.5) * CELL_SIZE
          ));
        }
      });
    });
    return pos;
  }, [maze]);

  const theme = useGameStore((state) => state.theme);
  const isMonsterCharging = useGameStore((state) => state.isMonsterCharging);
  
  // Procedural Textures
  const textures = useMemo(() => {
    const createWallTexture = (currentTheme: GameTheme) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      switch (currentTheme) {
        case GameTheme.HELL:
          // Organic, bloody, visceral
          ctx.fillStyle = '#1a0505';
          ctx.fillRect(0, 0, 256, 256);
          
          // Rib-like structures or large muscles
          ctx.strokeStyle = '#2d0a0a';
          ctx.lineWidth = 15;
          for(let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 50);
            ctx.bezierCurveTo(80, i * 50 - 20, 160, i * 50 + 20, 256, i * 50);
            ctx.stroke();
          }

          // Veins
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          for(let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 256, Math.random() * 256);
            for(let j = 0; j < 4; j++) {
              ctx.lineTo(Math.random() * 256, Math.random() * 256);
            }
            ctx.stroke();
          }

          // Pustules / Wet spots
          for(let i = 0; i < 15; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const r = Math.random() * 15 + 5;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Grime/Blood splatter
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          for(let i = 0; i < 100; i++) {
             ctx.fillRect(Math.random()*256, Math.random()*256, 3, 3);
          }
          break;

        case GameTheme.BLUE:
          // Cold high-tech blue
          ctx.fillStyle = '#0a1a2f';
          ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = '#1d4ed8';
          ctx.lineWidth = 1;
          for(let i = 0; i <= 256; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(30, 64, 175, 0.3)';
          for(let i = 0; i < 15; i++) {
            ctx.fillRect(Math.random()*256, Math.random()*256, 40, 20);
          }
          break;

        case GameTheme.HAUNTED:
          // Weathered stone / wallpaper
          ctx.fillStyle = '#262626';
          ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = '#404040';
          ctx.lineWidth = 2;
          // Cracks
          for(let i = 0; i < 15; i++) {
            ctx.beginPath();
            let x = Math.random() * 256;
            let y = Math.random() * 256;
            ctx.moveTo(x, y);
            for(let j = 0; j < 5; j++) {
              x += (Math.random() - 0.5) * 50;
              y += (Math.random() - 0.5) * 50;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          // Grime
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          for(let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
          }
          break;

        default: // FUTURISTIC
          // Base dark tech color
          ctx.fillStyle = '#0a0f1a';
          ctx.fillRect(0, 0, 256, 256);
          
          // Grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for(let i = 0; i <= 256; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
          }

          // Digital Circuit Patterns
          ctx.strokeStyle = '#ffffff'; 
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
          
          const drawCircuit = (x: number, y: number, length: number, dir: 'h' | 'v') => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (dir === 'h') ctx.lineTo(x + length, y);
            else ctx.lineTo(x, y + length);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(dir === 'h' ? x + length : x, dir === 'v' ? y + length : y, 4, 0, Math.PI * 2);
            ctx.fill();
          };

          ctx.fillStyle = '#ffffff';
          for(let i = 0; i < 8; i++) {
            const x = Math.random() * 200 + 28;
            const y = Math.random() * 200 + 28;
            drawCircuit(x, y, 40, Math.random() > 0.5 ? 'h' : 'v');
          }
          break;
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      if (currentTheme === GameTheme.FUTURISTIC) tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    const createFloorTexture = (currentTheme: GameTheme) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      
      switch (currentTheme) {
        case GameTheme.HELL:
          ctx.fillStyle = '#170505';
          ctx.fillRect(0, 0, 64, 64);
          // Pools of blood
          ctx.fillStyle = '#450a0a';
          for(let i = 0; i < 10; i++) {
             ctx.beginPath();
             ctx.arc(Math.random()*64, Math.random()*64, Math.random()*10, 0, Math.PI*2);
             ctx.fill();
          }
          // Texture noise
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          for(let i = 0; i < 40; i++) ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
          break;
        case GameTheme.BLUE:
          ctx.fillStyle = '#050a15';
          ctx.fillRect(0, 0, 64, 64);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(0, 0, 64, 64);
          break;
        case GameTheme.HAUNTED:
          ctx.fillStyle = '#171717';
          ctx.fillRect(0, 0, 64, 64);
          ctx.strokeStyle = '#0a0a0a';
          // Wood planks
          for(let i = 0; i < 4; i++) {
            ctx.strokeRect(0, i * 16, 64, 16);
          }
          break;
        default:
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, 64, 64);
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, 64, 64);
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(31, 31, 2, 2);
          break;
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(MAZE_SIZE, MAZE_SIZE);
      if (currentTheme === GameTheme.FUTURISTIC) tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    return {
      wall: createWallTexture(theme),
      floor: createFloorTexture(theme)
    };
  }, [theme]);

  const emissiveColor = useMemo(() => {
    if (isMonsterCharging) return "#ff0000";
    switch (theme) {
      case GameTheme.HELL: return "#ef4444";
      case GameTheme.BLUE: return "#2563eb";
      case GameTheme.HAUNTED: return "#404040";
      default: return "#00ff41";
    }
  }, [theme, isMonsterCharging]);

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    wallPositions.forEach((pos, i) => {
      tempObject.position.copy(pos);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, tempColor.set('#ffffff'));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [wallPositions]);

  return (
    <group>
      {/* Floor */}
      <Plane 
        args={[MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial map={textures.floor} roughness={0.8} />
      </Plane>

      {/* Ceiling */}
      <Plane 
        args={[MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE]} 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, WALL_HEIGHT, 0]}
      >
        <meshStandardMaterial map={textures.floor} roughness={1} />
      </Plane>

      {/* Optimized Walls */}
      <instancedMesh ref={meshRef} args={[null as any, null as any, wallCount]} castShadow receiveShadow>
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial 
          map={textures.wall} 
          emissiveMap={textures.wall}
          emissive={emissiveColor}
          emissiveIntensity={isMonsterCharging ? 1.5 : (theme === GameTheme.HELL ? 0.8 : 0.5)}
          roughness={theme === GameTheme.HELL ? 0.8 : 0.2} 
          metalness={theme === GameTheme.HELL ? 0 : 0.8} 
        />
      </instancedMesh>
    </group>
  );
}
