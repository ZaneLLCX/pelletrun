import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, GameStatus } from '../hooks/useGameStore';
import { motion, AnimatePresence } from 'motion/react';

export function Chat() {
  const isChatOpen = useGameStore((state) => state.isChatOpen);
  const setChatOpen = useGameStore((state) => state.setChatOpen);
  const sendMessage = useGameStore((state) => state.sendMessage);
  const status = useGameStore((state) => state.status);
  
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;

      if (e.key === 'Enter' || e.key === 't' || e.key === 'T') {
        if (!isChatOpen) {
          e.preventDefault();
          setChatOpen(true);
        }
      }
      
      if (e.key === 'Escape' && isChatOpen) {
        setChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, status, setChatOpen]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      setChatOpen(false);
    } else {
      setChatOpen(false);
    }
  };

  if (status !== GameStatus.PLAYING) return null;

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-lg border border-white/20" />
            <div className="relative flex items-center p-2">
              <span className="text-white/40 text-xs font-mono mr-2 uppercase tracking-widest">COMMS:</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={() => setChatOpen(false)}
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/20"
                placeholder="TYPE MESSAGE..."
                maxLength={100}
              />
            </div>
            {/* Scanned line effect */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-white/40 animate-pulse w-full" />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
