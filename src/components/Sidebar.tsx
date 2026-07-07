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
  LogOut,
  MonitorPlay
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  is3DMode?: boolean;
  setIs3DMode?: (is3D: boolean) => void;
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

export function Sidebar({ activeTab, setActiveTab, is3DMode, setIs3DMode }: SidebarProps) {
  return (
    <motion.div 
      animate={{ width: is3DMode ? 80 : 256 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
      className="h-screen border-r border-zinc-800 bg-zinc-900/20 flex flex-col pt-6 pb-4 overflow-hidden shrink-0"
    >
      <div className={cn("px-6 mb-10 flex items-center gap-3", is3DMode && "justify-center px-0")}>
        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
          <BrainCircuit className="w-5 h-5 text-black" />
        </div>
        {!is3DMode && (
          <span className="text-xl font-black tracking-tighter uppercase italic whitespace-nowrap">
            Exambridge <span className="text-cyan-400">v2.0</span>
          </span>
        )}
      </div>

      <div className="flex-1 px-4 space-y-2">
        {!is3DMode && <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2">Main Menu</div>}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                is3DMode ? "justify-center" : "justify-between",
                isActive 
                  ? "bg-zinc-800/80 border border-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
              title={is3DMode ? item.label : undefined}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                />
              )}
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5 transition-colors shrink-0", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")} />
                {!is3DMode && <span className="font-bold uppercase tracking-tighter text-sm whitespace-nowrap">{item.label}</span>}
              </div>
              {!is3DMode && item.badge && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest whitespace-nowrap">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 border-t border-zinc-800 space-y-2 mt-auto">
        <button 
          onClick={() => setIs3DMode && setIs3DMode(!is3DMode)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors",
            is3DMode && "justify-center"
          )}
          title={is3DMode ? "Toggle 3D View" : undefined}
        >
          <MonitorPlay className={cn("w-5 h-5 shrink-0", is3DMode && "text-cyan-400")} />
          {!is3DMode && <span className="font-bold uppercase tracking-tighter text-sm whitespace-nowrap">3D View</span>}
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group relative",
            is3DMode && "justify-center",
            activeTab === 'settings' 
              ? "bg-zinc-800/80 border border-zinc-700 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
          title={is3DMode ? "Settings" : undefined}
        >
          {activeTab === 'settings' && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            />
          )}
          <Settings className={cn("w-5 h-5 shrink-0", activeTab === 'settings' ? "text-cyan-400" : "group-hover:text-cyan-400")} />
          {!is3DMode && <span className="font-bold uppercase tracking-tighter text-sm whitespace-nowrap">Settings</span>}
        </button>
        <button className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-colors", is3DMode && "justify-center")} title={is3DMode ? "Logout" : undefined}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!is3DMode && <span className="font-bold uppercase tracking-tighter text-sm whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
}
