/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { Game } from './components/Game';
import { useGameStore } from './hooks/useGameStore';

export default function App() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none font-sans">
      <Game />
    </div>
  );
}
