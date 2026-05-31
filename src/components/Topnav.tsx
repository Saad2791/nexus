import React from 'react';
import { Bell, Search, Flame, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function Topnav() {
  return (
    <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="SEARCH SYSTEM..." 
            className="w-full bg-zinc-900 border-2 border-zinc-800 h-10 rounded-xl px-10 text-sm font-bold focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.5)] uppercase"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Streak Indicator */}
        <div className="flex items-center gap-3 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-300">14 DAY STREAK</span>
        </div>

        {/* XP / Level Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Level 42</span>
            <span className="text-xs text-lime-400 font-mono">8,450 XP</span>
          </div>
          <div className="relative w-10 h-10 rounded-full border-2 border-cyan-500 p-0.5 flex items-center justify-center bg-surface">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 m-0.5 border-t-cyan-500 animate-[spin_4s_linear_infinite]" />
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 text-black border border-zinc-900 border-2">
              <Zap className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-zinc-500 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full border-2 border-background" />
        </button>
      </div>
    </div>
  );
}
