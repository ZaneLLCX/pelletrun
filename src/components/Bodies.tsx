import React, { useMemo } from 'react';
import { MazeCell, MAZE_SIZE, CELL_SIZE } from '../constants';
import * as THREE from 'three';

interface BodiesProps {
  maze: MazeCell[][];
}

export function Bodies({ maze }: BodiesProps) {
  // Suit Texture
  const suitTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Off-white base
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 64, 64);
    
    // Grid pattern (technical look)
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.lineWidth = 1;
    for(let i = 0; i < 64; i += 8) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
    }

    // Wrinkles / Folds
    ctx.strokeStyle = '#9ca3af';
    for(let i = 0; i < 30; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 8, y + Math.random() * 8);
        ctx.stroke();
    }
    
    // Blood splatters on suit
    ctx.fillStyle = 'rgba(153, 27, 27, 0.4)';
    for(let i = 0; i < 15; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const size = Math.random() * 4 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  const bodies = useMemo(() => {
    const emptyCells: { x: number, y: number }[] = [];
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        // Avoid the exact center
        if (cell === 'path' && !(x === 1 && y === 1)) {
          emptyCells.push({ x, y });
        }
      });
    });

    const shuffled = [...emptyCells].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12).map((cell, i) => {
        const rotation = Math.random() * Math.PI * 2;
        return {
            id: `body-${i}`,
            pos: [
                (cell.x - MAZE_SIZE / 2 + 0.5) * CELL_SIZE + (Math.random() - 0.5) * 2,
                0.02,
                (cell.y - MAZE_SIZE / 2 + 0.5) * CELL_SIZE + (Math.random() - 0.5) * 2
            ] as [number, number, number],
            rotation,
            pose: {
                legL: (Math.random() - 0.5) * 0.5,
                legR: (Math.random() - 0.5) * 0.5,
                armL: Math.random() * 2,
                armR: Math.random() * 2,
                head: (Math.random() - 0.5) * 1.2,
                torsoRotation: (Math.random() - 0.5) * 0.4,
                isVisorBroken: Math.random() > 0.7
            }
        };
    });
  }, [maze]);

  return (
    <group>
      {bodies.map((body) => (
        <group key={body.id} position={body.pos} rotation={[0, body.rotation, 0]}>
          <group rotation={[0, 0, body.pose.torsoRotation]}>
            {/* Torso */}
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.65, 0.28, 0.48]} />
              <meshStandardMaterial map={suitTexture} roughness={0.9} />
            </mesh>

            {/* Chest Control Unit */}
            <mesh position={[0.25, 0.28, 0]}>
                <boxGeometry args={[0.15, 0.05, 0.2]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            
            {/* Backpack (PLSS) */}
            <mesh position={[-0.1, 0.25, 0]}>
              <boxGeometry args={[0.45, 0.45, 0.38]} />
              <meshStandardMaterial color="#d1d5db" roughness={0.7} />
            </mesh>

            {/* Neck Ring */}
            <mesh position={[0.35, 0.2, 0]} rotation={[0, 0, Math.PI/2]}>
              <torusGeometry args={[0.12, 0.03, 8, 12]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>

            {/* Head / Helmet */}
            <group position={[0.5, 0.22, 0]} rotation={[0, body.pose.head, 0]}>
              <mesh>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#f3f4f6" map={suitTexture} roughness={0.5} />
              </mesh>
              {/* Visor */}
              <mesh position={[0.06, 0.02, 0]}>
                <sphereGeometry args={[0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                <meshStandardMaterial 
                    color={body.pose.isVisorBroken ? "#1a1a1a" : "#0a0a0a"} 
                    metalness={0.8} 
                    roughness={0.2} 
                    emissive={body.pose.isVisorBroken ? "#450a0a" : "#000"}
                />
              </mesh>
            </group>

            {/* Left Leg */}
            <group position={[-0.32, 0.12, 0.18]} rotation={[0, body.pose.legL, 0]}>
                <mesh position={[-0.22, 0, 0]}>
                    <boxGeometry args={[0.45, 0.18, 0.2]} />
                    <meshStandardMaterial map={suitTexture} />
                </mesh>
                <group position={[-0.45, 0, 0]} rotation={[0, 0.4, 0]}>
                    <mesh position={[-0.2, 0, 0]}>
                        <boxGeometry args={[0.4, 0.16, 0.18]} />
                        <meshStandardMaterial map={suitTexture} />
                    </mesh>
                    {/* Boot */}
                    <mesh position={[-0.45, 0, 0]}>
                        <boxGeometry args={[0.2, 0.12, 0.22]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            </group>

            {/* Right Leg */}
            <group position={[-0.32, 0.12, -0.18]} rotation={[0, body.pose.legR, 0]}>
                <mesh position={[-0.22, 0, 0]}>
                    <boxGeometry args={[0.45, 0.18, 0.2]} />
                    <meshStandardMaterial map={suitTexture} />
                </mesh>
                <group position={[-0.45, 0, 0]} rotation={[0, -0.4, 0]}>
                    <mesh position={[-0.2, 0, 0]}>
                        <boxGeometry args={[0.4, 0.16, 0.18]} />
                        <meshStandardMaterial map={suitTexture} />
                    </mesh>
                    {/* Boot */}
                    <mesh position={[-0.45, 0, 0]}>
                        <boxGeometry args={[0.2, 0.12, 0.22]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            </group>

            {/* Left Arm */}
            <group position={[0.25, 0.18, 0.28]} rotation={[0, body.pose.armL, 0]}>
                <mesh position={[0.18, 0, 0]}>
                    <boxGeometry args={[0.35, 0.14, 0.14]} />
                    <meshStandardMaterial map={suitTexture} />
                </mesh>
                <group position={[0.35, 0, 0]} rotation={[0, 0.6, 0]}>
                    <mesh position={[0.2, 0, 0]}>
                        <boxGeometry args={[0.35, 0.13, 0.13]} />
                        <meshStandardMaterial map={suitTexture} />
                    </mesh>
                    {/* Glove */}
                    <mesh position={[0.4, 0, 0]}>
                        <boxGeometry args={[0.15, 0.1, 0.15]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            </group>

            {/* Right Arm */}
            <group position={[0.25, 0.18, -0.28]} rotation={[0, body.pose.armR, 0]}>
                <mesh position={[0.18, 0, 0]}>
                    <boxGeometry args={[0.35, 0.14, 0.14]} />
                    <meshStandardMaterial map={suitTexture} />
                </mesh>
                <group position={[0.35, 0, 0]} rotation={[0, -0.6, 0]}>
                    <mesh position={[0.2, 0, 0]}>
                        <boxGeometry args={[0.35, 0.13, 0.13]} />
                        <meshStandardMaterial map={suitTexture} />
                    </mesh>
                    {/* Glove */}
                    <mesh position={[0.4, 0, 0]}>
                        <boxGeometry args={[0.15, 0.1, 0.15]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            </group>
          </group>
          
          {/* Blood Puddle and Splatters */}
          <group position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <circleGeometry args={[1.4, 24]} />
              <meshStandardMaterial color="#2d0a0a" transparent opacity={0.6} depthWrite={false} />
            </mesh>
            {/* Random splatters around puddle */}
            {[...Array(5)].map((_, j) => (
                <mesh key={j} position={[(Math.random()-0.5)*3, (Math.random()-0.5)*3, 0.001]}>
                    <circleGeometry args={[Math.random()*0.3 + 0.1, 8]} />
                    <meshStandardMaterial color="#2d0a0a" transparent opacity={0.4} depthWrite={false} />
                </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}
