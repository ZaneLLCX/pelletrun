import React, { useEffect, useRef } from 'react';
import { useGameStore, GameStatus, MonsterState } from '../hooks/useGameStore';

export function AudioEngine() {
  const status = useGameStore((state) => state.status);
  const stamina = useGameStore((state) => state.stamina);
  const monsterDist = useGameStore((state) => state.monsterDistance);
  const monsterState = useGameStore((state) => state.monsterState);
  const isCharging = useGameStore((state) => state.isMonsterCharging);
  const isSprinting = useGameStore((state) => state.isSprinting);
  const isMoving = useGameStore((state) => state.isMoving);
  const isGlitching = useGameStore((state) => state.isGlitching);
  const isExhausted = useGameStore((state) => state.isExhausted);
  const pelletsCollected = useGameStore((state) => state.collectedPellets);
  const lastMessage = useGameStore((state) => state.lastMessage);

  const audioCtx = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);

  // robotic voice effects
  useEffect(() => {
    if (lastMessage && audioCtx.current && audioCtx.current.state !== 'closed') {
      const textToSpeak = lastMessage.split(" ").slice(0, -1).join(" ");
      if (!textToSpeak) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.pitch = 0.5; 
      utterance.rate = 0.8; 
      
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Natural')) && 
        v.lang.startsWith('en')
      ) || voices[0];
      
      if (bestVoice) utterance.voice = bestVoice;

      // Robotic layer
      const time = audioCtx.current.currentTime;
      const osc1 = audioCtx.current.createOscillator();
      const osc2 = audioCtx.current.createOscillator();
      const vGain = audioCtx.current.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(40, time);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(60, time);
      
      vGain.gain.setValueAtTime(0, time);
      
      osc1.connect(vGain);
      osc2.connect(vGain);
      vGain.connect(masterGain.current!);

      utterance.onstart = () => {
        vGain.gain.setTargetAtTime(0.04, audioCtx.current!.currentTime, 0.1);
        osc1.start();
        osc2.start();
      };
      
      utterance.onend = () => {
        vGain.gain.setTargetAtTime(0, audioCtx.current!.currentTime, 0.1);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch(e) {}
        }, 200);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [lastMessage]);

  // Sound nodes
  const ambientHum = useRef<OscillatorNode | null>(null);
  const horrorDrone = useRef<OscillatorNode | null>(null);
  const droneGain = useRef<GainNode | null>(null);
  const windNoise = useRef<AudioBufferSourceNode | null>(null);
  const windGain = useRef<GainNode | null>(null);
  const heartbeatOsc = useRef<OscillatorNode | null>(null);
  const chaseAmbiance = useRef<OscillatorNode | null>(null);
  const chaseAmbianceGain = useRef<GainNode | null>(null);
  const heartbeatInterval = useRef<any>(null);
  const heartbeatTime = useRef<number>(0);
  const breathingInterval = useRef<any>(null);
  const chompInterval = useRef<any>(null);
  const chompFreq = useRef<number>(0);

  useEffect(() => {
    if (status === GameStatus.PLAYING && !audioCtx.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new Ctx();
      masterGain.current = audioCtx.current.createGain();
      masterGain.current.connect(audioCtx.current.destination);
      masterGain.current.gain.value = 0.7; // Higher master volume

      // Start ambient hum
      const hum = audioCtx.current.createOscillator();
      const humGain = audioCtx.current.createGain();
      hum.type = 'sawtooth';
      hum.frequency.setValueAtTime(40, audioCtx.current.currentTime);
      humGain.gain.setValueAtTime(0.01, audioCtx.current.currentTime);
      
      const lpf = audioCtx.current.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(200, audioCtx.current.currentTime);

      hum.connect(lpf).connect(humGain).connect(masterGain.current);
      hum.start();
      ambientHum.current = hum;

      // Start horror drone (shimmering low frequency)
      const drone = audioCtx.current.createOscillator();
      droneGain.current = audioCtx.current.createGain();
      drone.type = 'square';
      drone.frequency.setValueAtTime(20, audioCtx.current.currentTime);
      droneGain.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
      
      const droneFilter = audioCtx.current.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(100, audioCtx.current.currentTime);

      drone.connect(droneFilter).connect(droneGain.current).connect(masterGain.current);
      drone.start();
      horrorDrone.current = drone;

      // Start unique chase ambiance (high tension string-like screech)
      const chase = audioCtx.current.createOscillator();
      chaseAmbianceGain.current = audioCtx.current.createGain();
      chase.type = 'sawtooth';
      chase.frequency.setValueAtTime(150, audioCtx.current.currentTime);
      chaseAmbianceGain.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
      
      const chaseFilter = audioCtx.current.createBiquadFilter();
      chaseFilter.type = 'highpass';
      chaseFilter.frequency.setValueAtTime(1000, audioCtx.current.currentTime);
      
      // Add heavy vibrato to chase ambiance
      const vibrato = audioCtx.current.createOscillator();
      const vibGain = audioCtx.current.createGain();
      vibrato.frequency.setValueAtTime(12, audioCtx.current.currentTime);
      vibGain.gain.setValueAtTime(50, audioCtx.current.currentTime);
      vibrato.connect(vibGain).connect(chase.frequency);
      vibrato.start();

      chase.connect(chaseFilter).connect(chaseAmbianceGain.current).connect(masterGain.current);
      chase.start();
      chaseAmbiance.current = chase;

      // Start atmospheric wind/noise
      const windSource = audioCtx.current.createBufferSource();
      const bufferSize = audioCtx.current.sampleRate * 2;
      const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      windSource.buffer = buffer;
      windSource.loop = true;

      const windFilter = audioCtx.current.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(400, audioCtx.current.currentTime);
      windFilter.Q.setValueAtTime(1, audioCtx.current.currentTime);

      windGain.current = audioCtx.current.createGain();
      windGain.current.gain.setValueAtTime(0.02, audioCtx.current.currentTime);

      windSource.connect(windFilter).connect(windGain.current).connect(masterGain.current);
      windSource.start();
      windNoise.current = windSource;

      // Modulate wind frequency
      const modulator = audioCtx.current.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(0.1, audioCtx.current.currentTime);
      const modGain = audioCtx.current.createGain();
      modGain.gain.setValueAtTime(200, audioCtx.current.currentTime);
      modulator.connect(modGain).connect(windFilter.frequency);
      modulator.start();
    }

    if (status === GameStatus.WON || status === GameStatus.LOST) {
       audioCtx.current?.close();
       audioCtx.current = null;
    }
  }, [status]);

  // Pellet Collect Sound
  const prevPellets = useRef(0);
  useEffect(() => {
    if (audioCtx.current && audioCtx.current.state === 'suspended' && pelletsCollected > prevPellets.current) {
        audioCtx.current.resume();
    }

    const delta = pelletsCollected - prevPellets.current;
    if (delta > 0 && audioCtx.current && audioCtx.current.state !== 'closed' && masterGain.current) {
      try {
        const time = audioCtx.current.currentTime;
        // Play sound for each pellet collected (in case of batching)
        for (let i = 0; i < delta; i++) {
            const playTime = time + (i * 0.05); // Tiny stagger
            const osc = audioCtx.current.createOscillator();
            const qGain = audioCtx.current.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, playTime);
            osc.frequency.exponentialRampToValueAtTime(1760, playTime + 0.1);
            qGain.gain.setValueAtTime(0.03, playTime);
            qGain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.2);
            osc.connect(qGain).connect(masterGain.current);
            osc.start(playTime);
            osc.stop(playTime + 0.2);
        }
      } catch (e) {
        console.warn('Audio error in pellet collection:', e);
      }
    }
    prevPellets.current = pelletsCollected;
  }, [pelletsCollected]);

  // Heartbeat Logic
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    
    const playHeartbeat = () => {
      if (!audioCtx.current || audioCtx.current.state === 'closed' || !masterGain.current) return;
      try {
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, audioCtx.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.current.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.2);
        osc.connect(gain).connect(masterGain.current);
        osc.start();
        osc.stop(audioCtx.current.currentTime + 0.2);
      } catch (e) {
        console.warn('Audio error in heartbeat:', e);
      }
    };

    // Rate increases as monster gets closer
    const distFactor = Math.max(0.1, Math.min(1, monsterDist / 15));
    const intervalTime = 200 + (distFactor * 1000);

    const currentIntervalTime = heartbeatTime.current;
    if (Math.abs(currentIntervalTime - intervalTime) > 50) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(playHeartbeat, intervalTime);
      heartbeatTime.current = intervalTime;
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };
  }, [status, monsterDist]);

  // Breathing Logic
  const isExhaling = useRef(false);
  const staminaRef = useRef(stamina);
  const isSprintingRef = useRef(isSprinting);
  const isExhaustedRef = useRef(isExhausted);

  useEffect(() => {
    staminaRef.current = stamina;
    isSprintingRef.current = isSprinting;
    isExhaustedRef.current = isExhausted;
  }, [stamina, isSprinting, isExhausted]);

  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const playBreath = () => {
       if (!audioCtx.current || audioCtx.current.state === 'closed' || !masterGain.current) return;
       try {
         const time = audioCtx.current.currentTime;
         const currentSprinting = isSprintingRef.current;
         const currentExhausted = isExhaustedRef.current;
         const currentStamina = staminaRef.current;
         const isInhaling = !isExhaling.current;

         // Organic variability in duration
         const variability = Math.random() * 0.1 - 0.05;
         const baseDuration = (currentSprinting || currentExhausted) ? 0.35 : 0.8;
         const duration = baseDuration + variability;
         
         const noiseNode = audioCtx.current.createBufferSource();
         const bufferSize = audioCtx.current.sampleRate * 2; // Use a longer buffer for better noise profile
         const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
         const data = buffer.getChannelData(0);
         // Filtered white noise for slightly softer air sound
         let lastOut = 0;
         for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = 0.5 * (white + lastOut); // Simple one-pole LP filter for "air" texture
            data[i] = lastOut;
         }
         noiseNode.buffer = buffer;
  
         // Primary spectral shaping (Throat/Nose resonance)
         const filter = audioCtx.current.createBiquadFilter();
         filter.type = 'bandpass';
         
         // Secondary filter for "Chest" resonance or "Wheeze"
         const filter2 = audioCtx.current.createBiquadFilter();
         filter2.type = currentExhausted ? 'peaking' : 'lowpass';
         
         const staminaFactor = 1 - (currentStamina / 100);
         const exertionFactor = (currentSprinting || currentExhausted) ? 1 : 0;

         // Spectral differences between Inhale and Exhale
         if (isInhaling) {
           // Inhale: Higher pitch, sharper, suction feel
           const startFreq = 800 + (staminaFactor * 400) + (exertionFactor * 300);
           const endFreq = startFreq * 1.3;
           filter.frequency.setValueAtTime(startFreq, time);
           filter.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
           filter.Q.setValueAtTime(1.5, time);

           filter2.frequency.setValueAtTime(3000, time);
           filter2.gain.setValueAtTime(currentExhausted ? 12 : 0, time);
           filter2.Q.setValueAtTime(2, time);
         } else {
           // Exhale: Lower pitch, weighted air, "sighing" feel
           const startFreq = 500 + (staminaFactor * 200) + (exertionFactor * 100);
           const endFreq = startFreq * 0.7;
           filter.frequency.setValueAtTime(startFreq, time);
           filter.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
           filter.Q.setValueAtTime(0.8, time);

           filter2.frequency.setValueAtTime(currentExhausted ? 2000 : 150, time);
           filter2.gain.setValueAtTime(currentExhausted ? 8 : 0, time);
           filter2.Q.setValueAtTime(currentExhausted ? 4 : 1, time);
         }
         
         const gain = audioCtx.current.createGain();
         const baseIntensity = isInhaling ? 0.12 : 0.08;
         const intensity = baseIntensity + (exertionFactor * 0.25) + (staminaFactor * 0.12);
         
         // Envelopes: Inhale is faster attack, Exhale is longer decay
         gain.gain.setValueAtTime(0.001, time);
         if (isInhaling) {
           gain.gain.exponentialRampToValueAtTime(intensity, time + duration * 0.4);
           gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
         } else {
           gain.gain.exponentialRampToValueAtTime(intensity, time + duration * 0.2);
           gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
         }
  
         noiseNode.connect(filter).connect(filter2).connect(gain).connect(masterGain.current);
         noiseNode.start(time);
         noiseNode.stop(time + duration);
         
         isExhaling.current = !isExhaling.current;
       } catch (e) {
         console.warn('Audio error in breathing:', e);
       }
    };

    let timeoutId: any;
    const scheduleNextBreath = () => {
        const currentSprinting = isSprintingRef.current;
        const currentExhausted = isExhaustedRef.current;
        const currentStamina = staminaRef.current;

        const baseInterval = 1800;
        const exertionReduction = (currentSprinting || currentExhausted) ? 1300 : 0;
        const staminaReduction = (1 - currentStamina / 100) * 800;
        const interval = Math.max(450, baseInterval - exertionReduction - staminaReduction);

        // Add 10% organic jitter to the interval
        const jitter = interval * (Math.random() * 0.2 - 0.1);
        
        timeoutId = setTimeout(() => {
            playBreath();
            scheduleNextBreath();
        }, Math.max(10, interval + jitter));
    };

    scheduleNextBreath();
    return () => clearTimeout(timeoutId);
  }, [status]);

  // Chase Ambiance Logic
  useEffect(() => {
    if (chaseAmbianceGain.current && audioCtx.current) {
      const isDetectionActive = monsterState === MonsterState.CHASE || isCharging;
      const targetVolume = isDetectionActive ? 0.2 : 0;
      chaseAmbianceGain.current.gain.setTargetAtTime(targetVolume, audioCtx.current.currentTime, 0.5);
    }
  }, [monsterState, isCharging]);

  // Drone volume proximity
  useEffect(() => {
    if (droneGain.current && audioCtx.current) {
      const volume = Math.max(0, Math.min(0.15, (1 - monsterDist / 20) * 0.15));
      droneGain.current.gain.setTargetAtTime(volume, audioCtx.current.currentTime, 0.1);
      
      if (horrorDrone.current) {
        // Slightly detune based on distance for "warping" effect
        horrorDrone.current.detune.setTargetAtTime(Math.sin(Date.now() * 0.01) * 20 * (1 - monsterDist / 20), audioCtx.current.currentTime, 0.1);
      }
    }
  }, [monsterDist]);

  // Monster Charge Screech
  const prevCharging = useRef(false);
  useEffect(() => {
    if (isCharging && !prevCharging.current && audioCtx.current && audioCtx.current.state !== 'closed' && masterGain.current) {
      try {
        const time = audioCtx.current.currentTime;
        
        // High frequency erratic screech
        const osc1 = audioCtx.current.createOscillator();
        const osc2 = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        osc1.frequency.setValueAtTime(800, time);
        osc1.frequency.exponentialRampToValueAtTime(3000, time + 0.1);
        osc1.frequency.exponentialRampToValueAtTime(1000, time + 0.3);
        osc1.frequency.exponentialRampToValueAtTime(2500, time + 0.5);

        osc2.frequency.setValueAtTime(850, time);
        osc2.frequency.exponentialRampToValueAtTime(3100, time + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(900, time + 0.35);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.frequency.linearRampToValueAtTime(500, time + 0.5);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain).connect(masterGain.current);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.8);
        osc2.stop(time + 0.8);
      } catch (e) {
        console.warn('Audio error in screech:', e);
      }
    }
    prevCharging.current = isCharging;
  }, [isCharging]);

  // Footsteps Logic
  useEffect(() => {
    if (status !== GameStatus.PLAYING || !isMoving) return;

    const playFootstep = () => {
      if (!audioCtx.current || audioCtx.current.state === 'closed' || !masterGain.current) return;
      try {
        const time = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        // Low thump for footstep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        
        // High frequency "click" or "crunch" for floor contact
        const noiseSource = audioCtx.current.createBufferSource();
        const bufferSize = audioCtx.current.sampleRate * 0.02;
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noiseSource.buffer = buffer;
        const noiseFilter = audioCtx.current.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, time);
        const noiseGain = audioCtx.current.createGain();

        gain.gain.setValueAtTime(isSprinting ? 0.3 : 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        
        noiseGain.gain.setValueAtTime(isSprinting ? 0.05 : 0.02, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(gain).connect(masterGain.current);
        noiseSource.connect(noiseFilter).connect(noiseGain).connect(masterGain.current);
        
        osc.start(time);
        osc.stop(time + 0.15);
        noiseSource.start(time);
        noiseSource.stop(time + 0.15);
      } catch (e) {
        console.warn('Audio error in footsteps:', e);
      }
    };

    const intervalTime = isSprinting ? 300 : 500;
    const interval = setInterval(playFootstep, intervalTime);

    return () => clearInterval(interval);
  }, [status, isMoving, isSprinting]);

  // Monster Chomping Sound
  useEffect(() => {
    if (status !== GameStatus.PLAYING || !audioCtx.current) return;

    const playChomp = () => {
      if (!audioCtx.current || audioCtx.current.state === 'closed' || !masterGain.current) return;
      try {
        const time = audioCtx.current.currentTime;
        
        // Thump (Jaw closing)
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        // Crunch (Teeth gnashing)
        const noise = audioCtx.current.createBufferSource();
        const bufferSize = audioCtx.current.sampleRate * 0.05;
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = audioCtx.current.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, time);
        const nGain = audioCtx.current.createGain();
        
        const volume = Math.max(0, 1 - (monsterDist / 25)); // Slightly longer range
        gain.gain.setValueAtTime(volume * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        nGain.gain.setValueAtTime(volume * 0.1, time);
        nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        
        osc.connect(gain).connect(masterGain.current);
        noise.connect(filter).connect(nGain).connect(masterGain.current);
        
        osc.start(time);
        osc.stop(time + 0.2);
        noise.start(time);
        noise.stop(time + 0.2);
      } catch (e) {
        console.warn('Audio error in chomp:', e);
      }
    };
    
    const freq = monsterState === MonsterState.CHASE ? 200 : 400; // Faster chomping
    
    if (chompFreq.current !== freq) {
      clearInterval(chompInterval.current);
      chompInterval.current = setInterval(playChomp, freq);
      chompFreq.current = freq;
    }

    return () => {
      if (chompInterval.current) {
        clearInterval(chompInterval.current);
        chompInterval.current = null;
        chompFreq.current = 0;
      }
    };
  }, [status, monsterDist, monsterState]);

  // Charge Siren
  useEffect(() => {
    let interval: any;
    if (isCharging && audioCtx.current && audioCtx.current.state !== 'closed') {
       const playSiren = () => {
          if (!audioCtx.current || audioCtx.current.state === 'closed' || !masterGain.current) return;
          try {
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, audioCtx.current.currentTime);
            osc.frequency.linearRampToValueAtTime(600, audioCtx.current.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.4);
            osc.connect(gain).connect(masterGain.current);
            osc.start();
            osc.stop(audioCtx.current.currentTime + 0.4);
          } catch (e) {
            console.warn('Audio error in siren:', e);
          }
       };
       interval = setInterval(playSiren, 500);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  // Glitch Sound Effect
  useEffect(() => {
    if (isGlitching && audioCtx.current && audioCtx.current.state !== 'closed' && masterGain.current) {
      try {
        const time = audioCtx.current.currentTime;
        const count = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
          const t = time + i * 0.05;
          const osc = audioCtx.current.createOscillator();
          const gain = audioCtx.current.createGain();
          
          osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
          osc.frequency.setValueAtTime(100 + Math.random() * 1000, t);
          osc.frequency.exponentialRampToValueAtTime(50 + Math.random() * 200, t + 0.05);
          
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          
          osc.connect(gain).connect(masterGain.current);
          osc.start(t);
          osc.stop(t + 0.05);
        }
      } catch (e) {
        console.warn('Audio error in glitch sound:', e);
      }
    }
  }, [isGlitching]);

  return null;
}
