import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { 
  MazeCell, 
  MAZE_SIZE, 
  CELL_SIZE, 
  WALL_HEIGHT,
  MONSTER_PATROL_SPEED,
  MONSTER_CHASE_SPEED,
  MONSTER_CHARGE_SPEED,
  DETECTION_RADIUS,
  HEARING_RADIUS_WALK,
  HEARING_RADIUS_RUN,
  CHASE_LOST_TIME,
  CHASE_LOST_PROBABILITY
} from '../constants';
import { useGameStore, GameStatus, MonsterState, GameTheme } from '../hooks/useGameStore';

interface MonsterProps {
  maze: MazeCell[][];
}

export function Monster({ maze }: MonsterProps) {
  const monsterRef = useRef<THREE.Group>(null);
  const status = useGameStore((state) => state.status);
  const setStatus = useGameStore((state) => state.setStatus);
  const monsterState = useGameStore((state) => state.monsterState);
  const setMonsterState = useGameStore((state) => state.setMonsterState);
  const isMonsterCharging = useGameStore((state) => state.isMonsterCharging);
  const setIsMonsterCharging = useGameStore((state) => state.setIsMonsterCharging);
  const setMonsterDistance = useGameStore((state) => state.setMonsterDistance);
  const isSprinting = useGameStore((state) => state.isSprinting);
  const theme = useGameStore((state) => state.theme);

  const patrolTarget = useRef<THREE.Vector3 | null>(null);
  const chaseLostTimer = useRef(0);
  const mouthRef = useRef<THREE.Group>(null);
  const monsterPosition = useRef<THREE.Vector3>(new THREE.Vector3());

  // Component-specific refs for theme variations
  const crystalRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const spikesGroupRef = useRef<THREE.Group>(null);
  const leftGlowEyeRef = useRef<THREE.Mesh>(null);
  const rightGlowEyeRef = useRef<THREE.Mesh>(null);
  const wispsRef = useRef<THREE.Group>(null);

  // Helpers
  const getGridPos = (pos: THREE.Vector3) => ({
    x: Math.floor(pos.x / CELL_SIZE + MAZE_SIZE / 2),
    z: Math.floor(pos.z / CELL_SIZE + MAZE_SIZE / 2)
  });

  const getWorldPos = (gx: number, gz: number) => new THREE.Vector3(
    (gx - MAZE_SIZE / 2 + 0.5) * CELL_SIZE,
    1.5,
    (gz - MAZE_SIZE / 2 + 0.5) * CELL_SIZE
  );

  const getNeighbors = (gx: number, gz: number) => {
    const neighbors: { x: number, z: number }[] = [];
    [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dz]) => {
      const nx = gx + dx;
      const nz = gz + dz;
      if (nx >= 0 && nx < MAZE_SIZE && nz >= 0 && nz < MAZE_SIZE && maze[nz][nx] === 'path') {
        neighbors.push({ x: nx, z: nz });
      }
    });
    return neighbors;
  };

  // Generate patrol waypoints based on maze topology (dead ends and junctions)
  const patrolWaypoints = useMemo(() => {
    const points: { x: number, z: number }[] = [];
    maze.forEach((row, z) => {
      row.forEach((cell, x) => {
        if (cell === 'path') {
          const neighbors = getNeighbors(x, z);
          // Waypoints are corners/dead ends (1 neighbor) or junctions (3+ neighbors)
          if (neighbors.length !== 2) {
            points.push({ x, z });
          }
        }
      });
    });
    
    // Sort waypoints by sequence to create a "path" around the maze
    // or just shuffle for now. Let's shuffle but keep enough of them.
    return points.sort(() => Math.random() - 0.5);
  }, [maze]);

  const currentWaypointIndex = useRef(0);
  const currentPath = useRef<{ x: number, z: number }[] | null>(null);

  const lastPath = useRef<{ x: number, z: number }[] | null>(null);
  const lastPathParams = useRef<string>("");

  // BFS Pathfinding
  const findPath = (start: { x: number, z: number }, end: { x: number, z: number }) => {
    const paramsKey = `${start.x},${start.z}-${end.x},${end.z}`;
    if (paramsKey === lastPathParams.current) return lastPath.current;

    const queue: { x: number, z: number, path: { x: number, z: number }[] }[] = [{ ...start, path: [] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.z}`);

    let result = null;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.x === end.x && current.z === end.z) {
        result = current.path;
        break;
      }

      for (const neighbor of getNeighbors(current.x, current.z)) {
        const key = `${neighbor.x},${neighbor.z}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ ...neighbor, path: [...current.path, neighbor] });
        }
      }
    }
    
    lastPathParams.current = paramsKey;
    lastPath.current = result;
    return result;
  };

  const lastKnownPlayerGrid = useRef<{ x: number, z: number } | null>(null);

  // Set initial position far from player
  useEffect(() => {
    if (monsterRef.current) {
      let bestX = MAZE_SIZE - 2;
      let bestZ = MAZE_SIZE - 2;
      outer: for (let y = MAZE_SIZE - 2; y > MAZE_SIZE / 2; y--) {
        for (let x = MAZE_SIZE - 2; x > MAZE_SIZE / 2; x--) {
          if (maze[y][x] === 'path') {
            bestX = x;
            bestZ = y;
            break outer;
          }
        }
      }
      const startPos = getWorldPos(bestX, bestZ);
      monsterRef.current.position.copy(startPos);
    }
  }, [maze]);

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING || !monsterRef.current) return;

    const monsterPos = monsterRef.current.position;
    const playerPos = (window as any).playerPosition as THREE.Vector3;
    if (!playerPos) return;

    monsterPosition.current = monsterRef.current.position;
    (window as any).monsterPosition = monsterPosition.current;

    const dist = monsterPos.distanceTo(playerPos);
    if (Math.abs(useGameStore.getState().monsterDistance - dist) > 0.1) {
      setMonsterDistance(dist);
    }

    if (dist < 1.5) {
      setStatus(GameStatus.LOST);
      return;
    }

    const gridPosM = getGridPos(monsterPos);
    const gridPosP = getGridPos(playerPos);

    let targetSpeed = MONSTER_PATROL_SPEED;
    let charging = false;

    // Detection
    const canSeePlayer = (() => {
       if (gridPosM.x === gridPosP.x || gridPosM.z === gridPosP.z) {
         const dx = Math.sign(gridPosP.x - gridPosM.x);
         const dz = Math.sign(gridPosP.z - gridPosM.z);
         let cx = gridPosM.x + dx;
         let cz = gridPosM.z + dz;
         while (cx !== gridPosP.x || cz !== gridPosP.z) {
           if (maze[cz][cx] === 'wall') return false;
           cx += dx;
           cz += dz;
         }
         return true;
       }
       return false;
    })();

    const hearingRadius = isSprinting ? HEARING_RADIUS_RUN : HEARING_RADIUS_WALK;
    const isPlayerDetected = canSeePlayer || dist < DETECTION_RADIUS / 2 || dist < hearingRadius;

    // State Machine
    if (isPlayerDetected) {
      if (useGameStore.getState().monsterState !== MonsterState.CHASE) {
        setMonsterState(MonsterState.CHASE);
      }
      lastKnownPlayerGrid.current = gridPosP;
      chaseLostTimer.current = 0;
    } else if (monsterState === MonsterState.CHASE) {
      if (useGameStore.getState().monsterState !== MonsterState.SEARCH) {
        setMonsterState(MonsterState.SEARCH);
      }
      chaseLostTimer.current = 0;
    } else if (monsterState === MonsterState.SEARCH) {
      chaseLostTimer.current += delta;
      if (chaseLostTimer.current > 4) { // Search for 4 seconds
        if (Math.random() < CHASE_LOST_PROBABILITY) {
          if (useGameStore.getState().monsterState !== MonsterState.PATROL) {
            setMonsterState(MonsterState.PATROL);
          }
          lastKnownPlayerGrid.current = null;
        } else {
            chaseLostTimer.current = 0; // reset for a second search loop or patrol
        }
      }
    }

    if (monsterState === MonsterState.CHASE) {
      targetSpeed = canSeePlayer ? MONSTER_CHASE_SPEED : MONSTER_PATROL_SPEED + 1;
      if (canSeePlayer && dist < 12) {
         charging = true;
         targetSpeed = MONSTER_CHARGE_SPEED;
      }
      
      const path = findPath(gridPosM, gridPosP);
      if (path && path.length > 0) {
        patrolTarget.current = getWorldPos(path[0].x, path[0].z);
      }
    } else if (monsterState === MonsterState.SEARCH && lastKnownPlayerGrid.current) {
        targetSpeed = MONSTER_PATROL_SPEED + 1;
        const path = findPath(gridPosM, lastKnownPlayerGrid.current);
        if (path && path.length > 0) {
            patrolTarget.current = getWorldPos(path[0].x, path[0].z);
        } else {
            setMonsterState(MonsterState.PATROL);
        }
    } else {
      // Patrol - Waypoint based navigation
      const currentWaypoint = patrolWaypoints[currentWaypointIndex.current];
      
      if (!currentWaypoint) {
          // Fallback to random neighbor if no waypoints (shouldn't happen)
          if (!patrolTarget.current || monsterPos.distanceTo(patrolTarget.current) < 0.1) {
              const neighbors = getNeighbors(gridPosM.x, gridPosM.z);
              const next = neighbors[Math.floor(Math.random() * neighbors.length)];
              patrolTarget.current = getWorldPos(next.x, next.z);
          }
      } else {
          // If we reached the current waypoint, pick the next one
          if (gridPosM.x === currentWaypoint.x && gridPosM.z === currentWaypoint.z) {
              currentWaypointIndex.current = (currentWaypointIndex.current + 1) % patrolWaypoints.length;
              currentPath.current = null; // Forces path recalculation
          }

          // Navigate along path to waypoint
          if (!currentPath.current || currentPath.current.length === 0) {
              currentPath.current = findPath(gridPosM, patrolWaypoints[currentWaypointIndex.current]);
          }

          if (currentPath.current && currentPath.current.length > 0) {
              const nextStep = currentPath.current[0];
              patrolTarget.current = getWorldPos(nextStep.x, nextStep.z);
              
              // If we reached the next step in the path, shift it
              if (monsterPos.distanceTo(patrolTarget.current) < 0.1) {
                  currentPath.current.shift();
              }
          }
      }
    }

    if (useGameStore.getState().isMonsterCharging !== charging) {
      setIsMonsterCharging(charging);
    }

    // Movement
    if (patrolTarget.current) {
      const dir = patrolTarget.current.clone().sub(monsterPos).normalize();
      monsterPos.add(dir.multiplyScalar(targetSpeed * delta));
      monsterRef.current.lookAt(patrolTarget.current);
    }

    // Animation (mouth chomping and organic pulse)
    if (mouthRef.current) {
      const freq = charging ? 15 : (monsterState === MonsterState.CHASE ? 10 : 5);
      mouthRef.current.rotation.x = Math.sin(state.clock.elapsedTime * freq) * 0.6;
    }

    // Modern procedurally animated theme elements
    if (theme === GameTheme.BLUE) {
       if (crystalRef.current) {
          crystalRef.current.rotation.y += delta * 2;
          crystalRef.current.rotation.x += delta * 1;
       }
       if (ringRef.current) {
          ringRef.current.rotation.z -= delta * 1.5;
          ringRef.current.rotation.y += delta * 0.8;
       }
       if (spikesGroupRef.current) {
          spikesGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.15;
          spikesGroupRef.current.rotation.y += delta * 0.5;
       }
    } else if (theme === GameTheme.HAUNTED) {
       if (wispsRef.current) {
          wispsRef.current.rotation.y += delta * 1.5;
          wispsRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.2;
       }
       // Flicker eyes organically
       const flicker = 0.8 + Math.sin(state.clock.elapsedTime * 15) * 0.2;
       if (leftGlowEyeRef.current) {
          leftGlowEyeRef.current.scale.setScalar(flicker);
       }
       if (rightGlowEyeRef.current) {
          rightGlowEyeRef.current.scale.setScalar(flicker);
       }
    }

    if (monsterRef.current) {
      // Body pulsing
      const pulseSpeed = charging ? 10 : 3;
      const pulseAmount = 0.05;
      const scale = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseAmount;
      monsterRef.current.children[0].scale.set(scale, scale, scale);
      
      // Slight vertical bobbing + jitter when charging
      const bobbing = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const jitter = charging ? (Math.random() - 0.5) * 0.1 : 0;
      monsterRef.current.children[0].position.y = 1.5 + bobbing + jitter;
      monsterRef.current.children[0].position.x = jitter;
    }
  });

  const lightColor = useMemo(() => {
    if (isMonsterCharging) {
      if (theme === GameTheme.HELL) return "#ff1100";
      if (theme === GameTheme.BLUE) return "#00ffff";
      if (theme === GameTheme.HAUNTED) return "#d8b4fe";
      return "#ff4400";
    }
    switch (theme) {
      case GameTheme.HELL: return "#dc2626";
      case GameTheme.BLUE: return "#2563eb";
      case GameTheme.HAUNTED: return "#a78bfa";
      default: return "#facc15";
    }
  }, [theme, isMonsterCharging]);

  return (
    <group ref={monsterRef}>
      <group position={[0, 1.5, 0]}>
        {/* FUTURISTIC ENVIRONMENT DESIGN */}
        {theme === GameTheme.FUTURISTIC && (
          <>
            {/* Monster Body - Metallic Cyber Sphere */}
            <mesh>
              <sphereGeometry args={[1.5, 32, 32]} />
              <meshPhysicalMaterial 
                color="#facc15" 
                roughness={0.1} 
                metalness={0.9} 
                emissive="#facc15" 
                emissiveIntensity={isMonsterCharging ? 1.55 : 0.4} 
                transmission={0.1}
                thickness={0.3}
              />
            </mesh>
            
            {/* Outer Glowing Hex/Wireframe Field */}
            <mesh scale={[1.12, 1.12, 1.12]}>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshStandardMaterial 
                color="#00ff41" 
                transparent 
                opacity={0.15} 
                wireframe 
                emissive="#00ff41"
                emissiveIntensity={1.5}
              />
            </mesh>
            
            {/* Jaw and Mechanical Mouth */}
            <group ref={mouthRef} position={[0, 0, 0.5]}>
               {/* Top Jaw */}
               <group position={[0, 0.2, 0]}>
                 <Box args={[2.2, 0.5, 1.2]}>
                   <meshStandardMaterial color="#0c0f1d" roughness={0.2} metalness={0.9} />
                 </Box>
                 {/* Teeth Row - Top */}
                 {[...Array(6)].map((_, i) => (
                   <mesh key={`tooth-t-${i}`} position={[(i - 2.5) * 0.35, -0.3, 0.4]} rotation={[Math.PI, 0, 0]}>
                     <coneGeometry args={[0.08, 0.35, 4]} />
                     <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={1} />
                   </mesh>
                 ))}
               </group>
    
               {/* Bottom Jaw */}
               <group position={[0, -0.2, 0]}>
                 <Box args={[2.2, 0.5, 1.2]}>
                   <meshStandardMaterial color="#0c0f1d" roughness={0.2} metalness={0.9} />
                 </Box>
                 {/* Teeth Row - Bottom */}
                 {[...Array(6)].map((_, i) => (
                   <mesh key={`tooth-b-${i}`} position={[(i - 2.5) * 0.35, 0.3, 0.4]}>
                     <coneGeometry args={[0.08, 0.35, 4]} />
                     <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={1} />
                   </mesh>
                 ))}
               </group>
    
               {/* Sci-Fi Visor / Core Eye */}
               <group position={[0, 0.7, 0.6]}>
                 <Box args={[1.8, 0.15, 0.2]}>
                   <meshStandardMaterial color="#020617" roughness={0.1} />
                 </Box>
                 {/* Bright Visor Pulse */}
                 <Box args={[1.7, 0.08, 0.22]} position={[0, 0, 0.01]}>
                   <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={isMonsterCharging ? 12 : 5} />
                 </Box>
               </group>
            </group>
          </>
        )}

        {/* HELL ENVIRONMENT DESIGN */}
        {theme === GameTheme.HELL && (
          <>
            {/* Monster Body - Visceral Flesh & Blood Lump */}
            <mesh>
              <sphereGeometry args={[1.5, 32, 32]} />
              <meshStandardMaterial 
                color="#3f0000" 
                roughness={0.8} 
                metalness={0.1}
                bumpScale={0.1}
              />
            </mesh>

            {/* Additional creepy blood/vein veins wrapping the body */}
            <mesh scale={[1.02, 1.02, 1.02]}>
              <sphereGeometry args={[1.5, 8, 8]} />
              <meshStandardMaterial 
                color="#991b1b" 
                wireframe 
                roughness={0.9}
                emissive="#7f1d1d"
                emissiveIntensity={isMonsterCharging ? 2 : 0.5}
              />
            </mesh>
            
            {/* Clutter of extra creepy eyes on the body! */}
            <group>
              {/* Top eye */}
              <Sphere args={[0.22, 16, 16]} position={[0, 1.2, 0.6]} rotation={[0.4, 0, 0]}>
                <meshStandardMaterial color="#fff" emissive="#dc2626" emissiveIntensity={1} />
              </Sphere>
              {/* Left eye pocket */}
              <Sphere args={[0.18, 16, 16]} position={[-1.1, 0.6, 0.8]} rotation={[0, -0.6, 0]}>
                <meshStandardMaterial color="#fff" emissive="#dc2626" emissiveIntensity={1} />
              </Sphere>
              {/* Right eye pocket */}
              <Sphere args={[0.18, 16, 16]} position={[1.1, 0.6, 0.8]} rotation={[0, 0.6, 0]}>
                <meshStandardMaterial color="#fff" emissive="#dc2626" emissiveIntensity={1} />
              </Sphere>
              {/* Extra random small tumors */}
              {[-0.8, 0, 0.8].map((x, idx) => (
                <Sphere key={idx} args={[0.3, 8, 8]} position={[x, -0.8, 0.9]}>
                  <meshStandardMaterial color="#881337" roughness={0.9} />
                </Sphere>
              ))}
            </group>

            {/* Horrific Fleshy Jaw */}
            <group ref={mouthRef} position={[0, 0, 0.5]}>
               {/* Fleshy Top Jaw */}
               <group position={[0, 0.2, 0]}>
                 <Box args={[2.3, 0.7, 1.3]}>
                   <meshStandardMaterial color="#1f0303" roughness={0.9} />
                 </Box>
                 {/* Creepy organic teeth */}
                 {[...Array(8)].map((_, i) => (
                   <mesh key={`tooth-hell-t-${i}`} position={[(i - 3.5) * 0.28, -0.4, 0.42]} rotation={[Math.PI, 0, 0]}>
                     <coneGeometry args={[0.09, 0.45, 4]} />
                     <meshStandardMaterial color="#fef08a" roughness={0.8} />
                   </mesh>
                 ))}
               </group>
    
               {/* Fleshy Bottom Jaw */}
               <group position={[0, -0.2, 0]}>
                 <Box args={[2.3, 0.7, 1.3]}>
                   <meshStandardMaterial color="#1f0303" roughness={0.9} />
                 </Box>
                 {/* Creepy organic teeth */}
                 {[...Array(8)].map((_, i) => (
                   <mesh key={`tooth-hell-b-${i}`} position={[(i - 3.5) * 0.28, 0.4, 0.42]}>
                     <coneGeometry args={[0.09, 0.45, 4]} />
                     <meshStandardMaterial color="#fef08a" roughness={0.8} />
                   </mesh>
                 ))}
               </group>
    
               {/* Central Primary Evil Eye */}
               <group position={[0, 0.8, 0.5]}>
                 <Sphere args={[0.35, 16, 16]} position={[0.5, 0, 0]}>
                   <meshStandardMaterial color="#ef4444" emissive="#ff0000" emissiveIntensity={isMonsterCharging ? 25 : 8} />
                 </Sphere>
                 <Sphere args={[0.35, 16, 16]} position={[-0.5, 0, 0]}>
                   <meshStandardMaterial color="#ef4444" emissive="#ff0000" emissiveIntensity={isMonsterCharging ? 25 : 8} />
                 </Sphere>
               </group>
            </group>
          </>
        )}

        {/* BLUE VOID ENVIRONMENT DESIGN */}
        {theme === GameTheme.BLUE && (
          <>
            {/* Spinning Polygonal Core */}
            <group ref={crystalRef}>
              <mesh>
                <octahedronGeometry args={[1.3, 0]} />
                <meshPhysicalMaterial 
                  color="#2563eb" 
                  emissive="#3b82f6" 
                  emissiveIntensity={isMonsterCharging ? 3.5 : 1.2} 
                  roughness={0.1}
                  metalness={0.9}
                  transmission={0.4}
                  thickness={0.8}
                />
              </mesh>
              
              {/* Outer Wireframe Shell */}
              <mesh scale={[1.15, 1.15, 1.15]}>
                <octahedronGeometry args={[1.3, 0]} />
                <meshBasicMaterial 
                  color="#60a5fa" 
                  wireframe
                  transparent
                  opacity={0.4}
                />
              </mesh>
            </group>

            {/* Orbiting Concentric Tech Rings */}
            <group ref={ringRef}>
               <mesh rotation={[Math.PI / 2, 0, 0]}>
                 <torusGeometry args={[1.9, 0.08, 8, 32]} />
                 <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={4} />
               </mesh>
               <mesh rotation={[0, Math.PI / 2, 0]}>
                 <torusGeometry args={[2.2, 0.06, 8, 32]} />
                 <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={3} />
               </mesh>
            </group>

            {/* Secondary floating sharp crystals which pulse */}
            <group ref={spikesGroupRef}>
              {[-1.6, 1.6].map((x, idx) => (
                <mesh key={idx} position={[x, 0, 0]} rotation={[0.5, 0.5, 0.5]}>
                  <coneGeometry args={[0.25, 0.8, 4]} />
                  <meshStandardMaterial 
                    color="#0284c7" 
                    emissive="#06b6d4" 
                    emissiveIntensity={isMonsterCharging ? 5 : 2} 
                    metalness={0.9} 
                    roughness={0.1} 
                  />
                </mesh>
              ))}
            </group>

            {/* A glowing geometric point gaze */}
            <group position={[0, 0.5, 1.2]}>
              <Sphere args={[0.22, 8, 8]} position={[0.4, 0, 0]}>
                <meshBasicMaterial color="#ffffff" />
              </Sphere>
              <Sphere args={[0.22, 8, 8]} position={[-0.4, 0, 0]}>
                <meshBasicMaterial color="#ffffff" />
              </Sphere>
            </group>
          </>
        )}

        {/* HAUNTED HOUSE ENVIRONMENT DESIGN */}
        {theme === GameTheme.HAUNTED && (
          <>
            {/* The Ghastly Floating Skull Mask */}
            <group position={[0, 0.4, 0]}>
              {/* Skull Dome */}
              <mesh position={[0, 0.2, 0.2]}>
                <sphereGeometry args={[1.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                <meshStandardMaterial 
                  color="#d4d4d8" 
                  roughness={0.6}
                  metalness={0.2}
                />
              </mesh>
              
              {/* Cheek / Jaw Bones */}
              <Box args={[1.5, 0.5, 0.8]} position={[0, -0.4, 0.4]}>
                <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
              </Box>

              {/* Creepy Skull Teeth */}
              {[...Array(5)].map((_, i) => (
                <Box key={`skull-teeth-${i}`} args={[0.1, 0.25, 0.1]} position={[(i - 2) * 0.23, -0.7, 0.65]}>
                  <meshStandardMaterial color="#a1a1aa" roughness={0.9} />
                </Box>
              ))}

              {/* Hollow Eye Sockets with glowing yellow-orange embers */}
              <group position={[0, 0, 1.05]}>
                {/* Left hollow */}
                <Sphere args={[0.28, 16, 16]} position={[0.4, 0.1, 0]}>
                  <meshBasicMaterial color="#000" />
                </Sphere>
                {/* Right hollow */}
                <Sphere args={[0.28, 16, 16]} position={[-0.4, 0.1, 0]}>
                  <meshBasicMaterial color="#000" />
                </Sphere>
                
                {/* Flickering eyes */}
                <Sphere args={[0.1, 8, 8]} position={[0.4, 0.1, 0.18]} ref={leftGlowEyeRef}>
                  <meshBasicMaterial color="#eab308" />
                </Sphere>
                <Sphere args={[0.1, 8, 8]} position={[-0.4, 0.1, 0.18]} ref={rightGlowEyeRef}>
                  <meshBasicMaterial color="#eab308" />
                </Sphere>
              </group>
            </group>

            {/* Ethereal Ghastly Aura Veil */}
            <mesh scale={[1.25, 1.25, 1.25]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshStandardMaterial 
                color="#737373" 
                transparent 
                opacity={0.25} 
                wireframe
                emissive="#a3a3a3"
                emissiveIntensity={isMonsterCharging ? 1.5 : 0.3}
              />
            </mesh>

            {/* Floating lost wisps orbiting the specter */}
            <group ref={wispsRef}>
              {[...Array(4)].map((_, idx) => {
                 const angle = (idx / 4) * Math.PI * 2;
                 const distance = 2.0;
                 return (
                   <Sphere key={idx} args={[0.18, 8, 8]} position={[Math.cos(angle) * distance, 0.5, Math.sin(angle) * distance]}>
                     <meshBasicMaterial color="#e9d5ff" opacity={0.6} transparent />
                   </Sphere>
                 );
              })}
            </group>
          </>
        )}

        {/* Dynamic Light */}
        <pointLight 
          color={lightColor} 
          intensity={isMonsterCharging ? 100 : 60} 
          distance={40} 
        />
        
        {/* Core Glow */}
        <Sphere args={[0.5, 16, 16]}>
          <meshBasicMaterial color="#fff" transparent opacity={0.8} />
        </Sphere>
      </group>
    </group>
  );
}
