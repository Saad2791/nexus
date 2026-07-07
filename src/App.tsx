import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topnav } from './components/Topnav';
import { Dashboard } from './components/Dashboard';
import { PastPapers } from './components/PastPapers';
import { AITutor } from './components/AITutor';
import { MyNotes } from './components/MyNotes';
import { SmartMarking } from './components/SmartMarking';
import { BattleMode } from './components/BattleMode';
import { RevisionPlanner } from './components/RevisionPlanner';
import { Settings } from './components/Settings';
import { BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#0A0514] flex items-center justify-center overflow-hidden [perspective:2000px] relative">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[#050505]" />
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, #6366f1, #a855f7)',
          bottom: '-20%',
          right: '-10%',
          opacity: is3DMode ? 0.4 : 0.1
        }}
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle, #3b82f6, #8b5cf6)',
          top: '-10%',
          left: '-10%',
          opacity: is3DMode ? 0.3 : 0.1
        }}
      />

      <motion.div 
        animate={{ 
          rotateY: is3DMode ? 15 : 0, 
          rotateX: is3DMode ? 5 : 0, 
          scale: is3DMode ? 0.9 : 1,
          borderRadius: is3DMode ? '1.5rem' : '0rem'
        }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.15 }}
        className="flex h-full w-full overflow-hidden bg-[#0F0F13] text-zinc-100 font-sans relative z-10"
        style={{
          boxShadow: is3DMode ? '-30px 40px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255,255,255,0.05)' : 'none',
          transformStyle: 'preserve-3d'
        }}
      >
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} is3DMode={is3DMode} setIs3DMode={setIs3DMode} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(circle_at_top_right,_#1e293b,_transparent_40%)]">
          <Topnav />
          
          <main className="flex-1 overflow-y-auto relative z-0">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Dashboard setActiveTab={setActiveTab} />
                </motion.div>
              )}
              {activeTab === 'papers' && (
                <motion.div key="papers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <PastPapers />
                </motion.div>
              )}
              {activeTab === 'tutor' && (
                <motion.div key="tutor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <AITutor />
                </motion.div>
              )}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <MyNotes />
                </motion.div>
              )}
              {activeTab === 'marking' && (
                <motion.div key="marking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <SmartMarking />
                </motion.div>
              )}
              {activeTab === 'battle' && (
                <motion.div key="battle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <BattleMode />
                </motion.div>
              )}
              {activeTab === 'planner' && (
                <motion.div key="planner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <RevisionPlanner />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <Settings />
                </motion.div>
              )}
              
              {/* Placeholders for other tabs */}
              {!['dashboard', 'papers', 'tutor', 'notes', 'marking', 'battle', 'planner', 'settings'].includes(activeTab) && (
                <motion.div key="coming-soon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BrainCircuit className="w-16 h-16 text-white/10 mb-4" />
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-500">{activeTab.toUpperCase()} Module</h2>
                  <p className="text-sm mt-2">Currently in development. Coming soon to Exambridge.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
