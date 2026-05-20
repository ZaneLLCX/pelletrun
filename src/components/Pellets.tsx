import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MazeCell, MAZE_SIZE, CELL_SIZE } from '../constants';
import { useGameStore, GameTheme } from '../hooks/useGameStore';

interface PelletsProps {
  maze: MazeCell[][];
}

export function Pellets({ maze }: PelletsProps) {
  const collectPellet = useGameStore((state) => state.collectPellet);
  const setTotalPellets = useGameStore((state) => state.setTotalPellets);
  const status = useGameStore((state) => state.status);
  const theme = useGameStore((state) => state.theme);

  // Procedural Eye Texture for Hell
  const eyeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Sclera (off-white with subtle shading)
    const scleraGrad = ctx.createLinearGradient(0, 0, 256, 0);
    scleraGrad.addColorStop(0, '#e5e7eb');
    scleraGrad.addColorStop(0.5, '#f9fafb');
    scleraGrad.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(0, 0, 256, 128);
    
    // Detailed Iris (gradients and fibers)
    const irisX = 128;
    const irisY = 64;
    const irisR = 45;
    
    const irisGrad = ctx.createRadialGradient(irisX, irisY, 5, irisX, irisY, irisR);
    irisGrad.addColorStop(0, '#450a0a');
    irisGrad.addColorStop(0.4, '#991b1b');
    irisGrad.addColorStop(0.8, '#dc2626');
    irisGrad.addColorStop(1, '#7f1d1d');
    
    ctx.fillStyle = irisGrad;
    ctx.beginPath(); ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2); ctx.fill();

    // Iris fibers
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for(let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(irisX, irisY);
        ctx.lineTo(irisX + Math.cos(angle) * irisR, irisY + Math.sin(angle) * irisR);
        ctx.stroke();
    }
    
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(irisX, irisY, 24, 0, Math.PI * 2); ctx.fill();

    // Reflections (Glossy look)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(irisX - 12, irisY - 12, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(irisX + 8, irisY + 8, 4, 0, Math.PI * 2); ctx.fill();

    // Organic Veins
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
    ctx.lineWidth = 1;
    for(let i = 0; i < 25; i++) {
        ctx.beginPath();
        let x = Math.random() < 0.5 ? Math.random() * 60 : 196 + Math.random() * 60;
        let y = Math.random() * 128;
        ctx.moveTo(x, y);
        for(let j = 0; j < 3; j++) {
            const nextX = x + (Math.random() - 0.5) * 40;
            const nextY = y + (Math.random() - 0.5) * 40;
            ctx.lineTo(nextX, nextY);
            x = nextX; y = nextY;
        }
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Track blink state per pellet index
  const blinksRef = useRef<{ [key: number]: { start: number, duration: number } }>({});

  const pellets = useMemo(() => {
    const list: { id: string, pos: [number, number, number] }[] = [];
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 'path') {
          list.push({
            id: `p-${x}-${y}`,
            pos: [
              (x - MAZE_SIZE / 2 + 0.5) * CELL_SIZE,
              0.5,
              (y - MAZE_SIZE / 2 + 0.5) * CELL_SIZE
            ]
          });
        }
      });
    });
    return list;
  }, [maze]);

  const activePelletsRef = useRef<Set<string>>(new Set());
  const [activeCount, setActiveCount] = useState(0);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const ids = new Set(pellets.map(p => p.id));
    activePelletsRef.current = ids;
    setActiveCount(ids.size);
    setTotalPellets(ids.size);
    
    // Global exposure for Radar
    (window as any).pelletLocations = pellets;
    (window as any).activePellets = activePelletsRef.current;
  }, [pellets, setTotalPellets]);

  useEffect(() => {
    (window as any).activePelletsCount = activeCount;
  }, [activeCount]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Check for player collection
    const playerPos = (window as any).playerPosition as THREE.Vector3;
    if (playerPos) {
      pellets.forEach((p) => {
        if (activePelletsRef.current.has(p.id)) {
          // Check 2D distance (ignore Y height)
          const dx = playerPos.x - p.pos[0];
          const dz = playerPos.z - p.pos[2];
          const distSq = dx * dx + dz * dz;
          
          if (distSq < 4.0) { // Increased collection radius (radius = 2.0)
            activePelletsRef.current.delete(p.id);
            setActiveCount(activePelletsRef.current.size);
            collectPellet();
          }
        }
      });
    }

    let i = 0;
    pellets.forEach((p) => {
      if (activePelletsRef.current.has(p.id)) {
        const floatY = p.pos[1] + Math.sin(state.clock.elapsedTime * 3 + i) * 0.15;
        tempObject.position.set(p.pos[0], floatY, p.pos[2]);
        
        let scaleY = 1;
        if (theme === GameTheme.HELL) {
            if (playerPos) {
                tempObject.lookAt(playerPos);
                tempObject.rotateY(-Math.PI / 2);
            }

            // Blinking logic
            if (!blinksRef.current[i] && Math.random() < 0.005) {
                blinksRef.current[i] = { start: state.clock.elapsedTime, duration: 0.1 + Math.random() * 0.1 };
            }
            
            const blink = blinksRef.current[i];
            if (blink) {
                const elapsed = state.clock.elapsedTime - blink.start;
                if (elapsed > blink.duration) {
                    delete blinksRef.current[i];
                } else {
                    // Squash Y scale for blink
                    scaleY = Math.abs(Math.sin((elapsed / blink.duration) * Math.PI)) < 0.1 ? 1 : 0.1;
                }
            }
        } else {
            tempObject.rotation.set(0, 0, 0);
        }

        tempObject.scale.set(1, scaleY, 1);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i++, tempObject.matrix);
      } else {
        // Clear matrix for hidden pellets
        tempObject.position.set(0, -100, 0);
        tempObject.scale.setScalar(0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i++, tempObject.matrix);
      }
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const pelletMatParams = useMemo(() => {
    switch (theme) {
      case GameTheme.HELL:
        return {
          color: '#ffffff',
          emissive: '#ff0000',
          emissiveIntensity: 0.5,
          map: eyeTexture
        };
      case GameTheme.BLUE:
        return {
          color: '#3b82f6',
          emissive: '#3b82f6',
          emissiveIntensity: 4,
          map: null
        };
      case GameTheme.HAUNTED:
        return {
          color: '#f8fafc',
          emissive: '#f8fafc',
          emissiveIntensity: 2,
          transparent: true,
          opacity: 0.8,
          map: null
        };
      default: // FUTURISTIC
        return {
          color: '#facc15',
          emissive: '#facc15',
          emissiveIntensity: 4,
          map: null
        };
    }
  }, [theme, eyeTexture]);

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, pellets.length]}>
      <sphereGeometry args={[0.2, 12, 12]} />
      <meshStandardMaterial 
        {...pelletMatParams}
      />
    </instancedMesh>
  );
}
