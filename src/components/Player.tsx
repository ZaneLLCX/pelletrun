import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import { 
  MazeCell, 
  MAZE_SIZE, 
  CELL_SIZE, 
  PLAYER_WALK_SPEED, 
  PLAYER_RUN_SPEED,
  PLAYER_SLOW_SPEED,
  STAMINA_DRAIN_RATE,
  STAMINA_REGEN_RATE,
  MAX_STAMINA
} from '../constants';
import { useGameStore, GameStatus } from '../hooks/useGameStore';

interface PlayerProps {
  maze: MazeCell[][];
}

export function Player({ maze }: PlayerProps) {
  const { camera } = useThree();
  const setStamina = useGameStore((state) => state.setStamina);
  const stamina = useGameStore((state) => state.stamina);
  const isExhausted = useGameStore((state) => state.isExhausted);
  const setIsExhausted = useGameStore((state) => state.setIsExhausted);
  const setSprinting = useGameStore((state) => state.setSprinting);
  const status = useGameStore((state) => state.status);
  const setStatus = useGameStore((state) => state.setStatus);
  const isChatOpen = useGameStore((state) => state.isChatOpen);

  const velocity = useRef(new THREE.Vector3());
  const moveDirection = useRef({ forward: 0, backward: 0, left: 0, right: 0 });
  const isSprintingInput = useRef(false);

  // Initialize position to [1, 1] in maze grid
  useEffect(() => {
    const startX = (1 - MAZE_SIZE / 2 + 0.5) * CELL_SIZE;
    const startZ = (1 - MAZE_SIZE / 2 + 0.5) * CELL_SIZE;
    camera.position.set(startX, 1.7, startZ);
    (window as any).playerPosition = camera.position;
  }, [maze, camera]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isChatOpen) return;
      switch (e.code) {
        case 'KeyW': moveDirection.current.forward = 1; break;
        case 'KeyS': moveDirection.current.backward = 1; break;
        case 'KeyA': moveDirection.current.left = 1; break;
        case 'KeyD': moveDirection.current.right = 1; break;
        case 'ShiftLeft': isSprintingInput.current = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
       switch (e.code) {
        case 'KeyW': moveDirection.current.forward = 0; break;
        case 'KeyS': moveDirection.current.backward = 0; break;
        case 'KeyA': moveDirection.current.left = 0; break;
        case 'KeyD': moveDirection.current.right = 0; break;
        case 'ShiftLeft': isSprintingInput.current = false; break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isChatOpen]);

  const checkCollision = (targetPos: THREE.Vector3) => {
    const radius = 0.5;
    // Helper to get grid cell from world pos
    const getCell = (x: number, z: number) => {
      const gx = Math.floor(x / CELL_SIZE + MAZE_SIZE / 2);
      const gz = Math.floor(z / CELL_SIZE + MAZE_SIZE / 2);
      if (gx < 0 || gx >= MAZE_SIZE || gz < 0 || gz >= MAZE_SIZE) return 'wall';
      return maze[gz][gx];
    };

    // Check 4 points around target pos
    const points = [
      { x: targetPos.x + radius, z: targetPos.z },
      { x: targetPos.x - radius, z: targetPos.z },
      { x: targetPos.x, z: targetPos.z + radius },
      { x: targetPos.x, z: targetPos.z - radius },
    ];

    return points.some(p => getCell(p.x, p.z) === 'wall');
  };

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;
    if (isChatOpen) {
        // Reset moving state if chat opens
        if (useGameStore.getState().isMoving) {
            useGameStore.getState().setIsMoving(false);
        }
        return;
    }

    // Movement
    let nextExhausted = isExhausted;
    if (stamina <= 0) nextExhausted = true;
    if (stamina >= 50) nextExhausted = false;

    if (isExhausted !== nextExhausted) {
      setIsExhausted(nextExhausted);
    }

    const canSprint = stamina > 0 && isSprintingInput.current && !nextExhausted;
    let speed = canSprint ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    
    if (nextExhausted) {
      speed = PLAYER_SLOW_SPEED;
    }
    
    // Only update store if value changed to avoid unnecessary re-renders/warnings
    if (useGameStore.getState().isSprinting !== canSprint) {
      setSprinting(canSprint);
    }

    // Stamina logic
    if (canSprint) {
      setStamina(Math.max(0, stamina - STAMINA_DRAIN_RATE * delta));
    } else {
      setStamina(Math.min(MAX_STAMINA, stamina + STAMINA_REGEN_RATE * delta));
    }

    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, moveDirection.current.backward - moveDirection.current.forward);
    const sideVector = new THREE.Vector3(moveDirection.current.left - moveDirection.current.right, 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    velocity.current.set(direction.x, 0, direction.z);
    
    // Check if moving
    const isMovingNow = moveDirection.current.forward || moveDirection.current.backward || moveDirection.current.left || moveDirection.current.right;
    if (useGameStore.getState().isMoving !== !!isMovingNow) {
      useGameStore.getState().setIsMoving(!!isMovingNow);
    }
    
    const nextPos = camera.position.clone().add(velocity.current.clone().multiplyScalar(delta));
    
    // Collision check for X and Z separately for sliding along walls
    const nextPosX = camera.position.clone().add(new THREE.Vector3(velocity.current.x * delta, 0, 0));
    if (!checkCollision(nextPosX)) {
      camera.position.x = nextPosX.x;
    }
    const nextPosZ = camera.position.clone().add(new THREE.Vector3(0, 0, velocity.current.z * delta));
    if (!checkCollision(nextPosZ)) {
      camera.position.z = nextPosZ.z;
    }

    // Win condition check
    const pelletsLeft = (window as any).activePelletsCount || 0;
    const totalPellets = useGameStore.getState().totalPellets;
    
    // Tracker logic: Active if > 75% pellets collected
    const collected = totalPellets - pelletsLeft;
    const trackerCondition = totalPellets > 0 && (collected / totalPellets >= 0.75);
    if (useGameStore.getState().isTrackerActive !== trackerCondition) {
      useGameStore.getState().setTrackerActive(trackerCondition);
    }

    if (totalPellets > 0 && pelletsLeft === 0 && useGameStore.getState().status !== GameStatus.WON) {
      setStatus(GameStatus.WON);
    }
  });

  return (
    <>
      {status === GameStatus.PLAYING && !isChatOpen && <PointerLockControls />}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={15} 
        distance={20} 
        color="#fff" 
        castShadow
      />
      <spotLight 
        position={[0, 0.5, 0]} 
        intensity={40} 
        distance={35} 
        angle={Math.PI / 2} 
        penumbra={1} 
        color="#fff" 
      />
    </>
  );
}
