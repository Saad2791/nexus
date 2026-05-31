import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bot, 
  FileText, 
  BrainCircuit, 
  Target,
  Trophy,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'papers', label: 'Past Papers', icon: BookOpen },
  { id: 'tutor', label: 'AI Tutor', icon: Bot },
  { id: 'notes', label: 'My Notes', icon: FileText },
  { id: 'marking', label: 'Smart Marking', icon: BrainCircuit },
  { id: 'battle', label: 'Battle Mode', icon: Trophy, badge: 'BETA' },
  { id: 'planner', label: 'Revision Planner', icon: Target },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 h-screen border-r border-zinc-800 bg-zinc-900/20 flex flex-col pt-6 pb-4">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <BrainCircuit className="w-5 h-5 text-black" />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase italic">
          Nexus.OS <span className="text-cyan-400">v2.0</span>
        </span>
      </div>

      <div className="flex-1 px-4 space-y-2">
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-zinc-800/80 border border-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                />
              )}
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")} />
                <span className="font-bold uppercase tracking-tighter text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 border-t border-zinc-800 space-y-2 mt-auto">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group relative",
            activeTab === 'settings' 
              ? "bg-zinc-800/80 border border-zinc-700 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          {activeTab === 'settings' && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            />
          )}
          <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-cyan-400" : "group-hover:text-cyan-400")} />
          <span className="font-bold uppercase tracking-tighter text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-bold uppercase tracking-tighter text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
