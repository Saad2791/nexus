import React from 'react';
import { Target, TrendingUp, AlertTriangle, PlayCircle, BookOpen, Clock, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

const performanceData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 68 },
  { name: 'Wed', score: 75 },
  { name: 'Thu', score: 72 },
  { name: 'Fri', score: 85 },
  { name: 'Sat', score: 82 },
  { name: 'Sun', score: 90 },
];

export function Dashboard({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black italic uppercase leading-none tracking-tighter"
          >
            Ready to<br/>
            <span className="text-cyan-400">Dominate?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-zinc-400 text-lg max-w-md uppercase font-bold tracking-tight"
          >
            0620 Chemistry: P4 Structured Theory starts in 12 days.
          </motion.p>
        </div>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs py-4 px-8 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <PlayCircle className="w-5 h-5 fill-black" />
          JOIN ARENA
        </motion.button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Stats & Graphs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Papers Library', value: '8,420', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border border-cyan-500/20' },
              { label: 'Hours Studied', value: '128h', icon: Clock, color: 'text-white', bg: 'bg-zinc-800 border border-zinc-700' },
              { label: 'Avg Accuracy', value: '78%', icon: Target, color: 'text-lime-400', bg: 'bg-lime-500/10 border border-lime-500/20' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-black italic tracking-tighter uppercase">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Performance Graph */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Performance Trend (Last 7 Days)
              </h2>
              <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm font-bold uppercase focus:outline-none focus:border-cyan-500 outline-none">
                <option>All Subjects</option>
                <option>Computer Science 2210</option>
                <option>Mathematics 0580</option>
              </select>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-neon-cyan)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-neon-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--color-neon-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>

        {/* Right Column (AI Suggestions & Weak Topics) */}
        <div className="space-y-6">
          
          {/* AI Suggestions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                Recent AI Feedback
              </span>
              <span className="text-xs font-mono text-cyan-400">92% MATCH</span>
            </div>
            
            <div className="flex-1">
              <div className="bg-zinc-950 p-4 rounded-xl border-l-4 border-cyan-400 text-sm leading-relaxed text-zinc-300">
                <span className="text-cyan-400 font-bold uppercase">Focus Area:</span> I noticed you're struggling with <span className="text-white font-bold">Logic Gates</span> in CS 2210. 
                Want me to generate a 5-question targeted mini-quiz to reinforce this?
              </div>
            </div>
            <button className="mt-6 w-full py-4 bg-zinc-800 border border-zinc-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all">
              Generate Practice
            </button>
          </motion.div>

          {/* Weak Topics to Review */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden"
          >
            <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Weakness Analysis
            </h2>
            <div className="space-y-6">
              {[
                { subject: 'Math 0580', topic: 'Trigonometry 3D', accuracy: 42, color: 'text-red-400', bg: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]', status: 'REVISE' },
                { subject: 'CS 2210', topic: 'Von Neumann Arch.', accuracy: 58, color: 'text-orange-400', bg: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]', status: 'PRACTICE' },
                { subject: 'Physics 0625', topic: 'Electromagnetism', accuracy: 88, color: 'text-lime-400', bg: 'bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]', status: 'MASTERY' },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-xs font-bold uppercase mb-2">
                    <span className="text-white">{item.topic} <span className="text-zinc-500 ml-1">{item.subject}</span></span>
                    <span className={item.color}>{item.status} ({item.accuracy}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.accuracy}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                      className={`h-full ${item.bg} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
