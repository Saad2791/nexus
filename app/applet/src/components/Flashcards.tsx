import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, BrainCircuit, Lightbulb, AlertTriangle, Sparkles, Binary, Calculator, Atom, Globe, Book, RefreshCcw } from 'lucide-react';

export type Flashcard = {
  question: string;
  answer: string;
};

interface FlashcardsProps {
  cards: Flashcard[];
  subject?: string;
}

export function Flashcards({ cards, subject }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleConfidence = (e: React.MouseEvent) => {
    e.stopPropagation();
    nextCard();
  };

  if (!cards || cards.length === 0) return (
    <div className="flex flex-col items-center justify-center p-10 h-full text-center bg-[#0a0f1c]">
      <p className="text-indigo-400/50 font-bold uppercase tracking-widest text-sm">No flashcards were generated.</p>
    </div>
  );

  const currentCard = cards[currentIndex];

  let displaySubject = subject?.replace('_', ' ') || 'Flashcards';
  let norm = subject?.toLowerCase() || '';
  if (!norm || norm === 'general') {
    const allText = cards.map(c => c.question + ' ' + c.answer).join(' ').toLowerCase();
    if (allText.includes('computer') || allText.includes('hardware') || allText.includes('software') || allText.includes('data') || allText.includes('byte')) {
      norm = 'computer science';
      displaySubject = 'Computer Science';
    } else if (allText.includes('math') || allText.includes('equation') || allText.includes('algebra')) {
      norm = 'math';
      displaySubject = 'Mathematics';
    } else if (allText.includes('cell') || allText.includes('atom') || allText.includes('physics')) {
      norm = 'science';
      displaySubject = 'Science';
    }
  }

  const getSubjectIconComponent = () => {
    if (norm.includes('computer') || norm.includes('programming')) return Binary;
    if (norm.includes('math')) return Calculator;
    if (norm.includes('science') || norm.includes('physics') || norm.includes('chemistry') || norm.includes('biology')) return Atom;
    if (norm.includes('history') || norm.includes('humanities')) return Globe;
    if (norm.includes('language') || norm.includes('english')) return Book;
    return BrainCircuit;
  };

  const SubjectIcon = getSubjectIconComponent();

  const getDifficulty = (text: string) => {
    const len = text.length;
    if (len < 40) return { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (len < 80) return { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'Hard', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  };

  const diff = getDifficulty(currentCard.question);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden items-center justify-center bg-[#050814] text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-30">
         <motion.div 
           className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 relative"
           initial={{ width: 0 }}
           animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
           transition={{ duration: 0.3, ease: "easeOut" }}
         >
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-400 blur-sm rounded-full" />
         </motion.div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full flex items-center justify-center px-4 relative z-10 max-w-7xl mx-auto h-full">
        
        {/* Left Nav */}
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="hidden md:flex shrink-0 w-14 h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed transition-all shadow-xl backdrop-blur-md absolute left-8 lg:left-16 z-20"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
        </button>

        {/* Flashcard Area */}
        <div 
          className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[460px] aspect-[4/5] sm:aspect-[3/4] relative mt-[-60px] sm:mt-[-40px]"
          style={{ perspective: '1500px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 60, rotateY: -15, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, rotateY: 15, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <div 
                className="w-full h-full relative cursor-pointer group"
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    className="w-full h-full relative rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                     {/* ----------------- FRONT FACE ----------------- */}
                     <div 
                       className="absolute inset-0 w-full h-full rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 border border-white/10 backdrop-blur-3xl flex flex-col p-6 sm:p-8 md:p-10 overflow-hidden" 
                       style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                     >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                       
                       <div className="w-full flex justify-between items-start mb-auto shrink-0 z-10">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                             <SubjectIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                           </div>
                           <div className="flex flex-col justify-center">
                             <div className="text-white/40 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mb-0.5">{norm}</div>
                             <div className="text-white/90 font-semibold text-sm sm:text-base leading-none">{displaySubject}</div>
                           </div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                           <div className="text-white/30 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
                             {currentIndex + 1} / {cards.length}
                           </div>
                           <div className={`px-3 py-1 sm:px-4 sm:py-1.5 ${diff.bg} ${diff.color} text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full border ${diff.border}`}>
                             {diff.label}
                           </div>
                         </div>
                       </div>
                       
                       <div className="w-full my-auto flex flex-col items-center justify-center text-center px-2 py-6 z-10">
                         <h2 className="text-[22px] sm:text-3xl md:text-[32px] font-bold text-white leading-[1.3] md:leading-[1.4] tracking-tight text-balance">
                           {currentCard.question}
                         </h2>
                       </div>

                       <div className="w-full mt-auto pt-6 text-center shrink-0 z-10">
                         <p className="text-white/30 text-[11px] sm:text-xs font-semibold tracking-wider uppercase animate-pulse flex items-center justify-center gap-2">
                           <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tap to reveal
                         </p>
                       </div>
                     </div>

                     {/* ----------------- BACK FACE ----------------- */}
                     <div 
                       className="absolute inset-0 w-full h-full rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-b from-indigo-950/90 to-[#050814]/95 border border-indigo-500/30 backdrop-blur-3xl flex flex-col p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden" 
                       style={{ 
                         backfaceVisibility: "hidden", 
                         WebkitBackfaceVisibility: "hidden", 
                         transform: "rotateY(180deg)" 
                       }}
                     >
                        <div className="w-full flex justify-between items-center mb-6 shrink-0 border-b border-white/10 pb-4 md:pb-6">
                           <div className="text-indigo-400 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                              <Sparkles className="w-4 h-4" /> Answer
                           </div>
                           <div className="w-8 h-8 rounded-full bg-white/5 text-white/50 flex items-center justify-center border border-white/5 text-xs font-bold">
                             {currentIndex + 1}
                           </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-2 md:pr-4 pb-4 space-y-6 md:space-y-8">
                           <p className="text-lg sm:text-xl md:text-[22px] text-white/95 font-medium leading-relaxed">
                             {currentCard.answer}
                           </p>

                           {/* Mock Extras */}
                           <div className="space-y-3 sm:space-y-4 pt-2 w-full mt-auto shrink-0">
                              <button onClick={(e) => e.stopPropagation()} className="w-full py-3.5 sm:py-4 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-2.5 transition-colors group">
                                 <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:text-indigo-300" />
                                 <span className="text-indigo-300 font-semibold text-xs sm:text-sm group-hover:text-indigo-200">AI Explain Concept</span>
                              </button>

                              {diff.label !== 'Easy' && (
                                <div className="p-4 sm:p-5 bg-rose-500/5 hover:bg-rose-500/10 transition-colors border border-rose-500/20 rounded-2xl relative overflow-hidden">
                                   <div className="absolute left-0 top-0 w-1 h-full bg-rose-500/40" />
                                   <h4 className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">
                                     <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Common Mistake
                                   </h4>
                                   <p className="text-rose-200/70 text-xs sm:text-sm font-medium leading-relaxed">
                                     Many confuse this with related terms. Make sure to understand the nuanced distinction to ace the exam.
                                   </p>
                                </div>
                              )}

                              <div className="p-4 sm:p-5 bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/20 rounded-2xl relative overflow-hidden">
                                 <div className="absolute left-0 top-0 w-1 h-full bg-amber-500/40" />
                                 <h4 className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">
                                   <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Exam Tip
                                 </h4>
                                 <p className="text-amber-200/70 text-xs sm:text-sm font-medium leading-relaxed">
                                   Focus on structural principles over rote memorization to prepare effectively.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Confidence Buttons overlay */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute top-[100%] left-0 w-full pt-4 sm:pt-6 flex justify-center gap-2 sm:gap-3 md:gap-4 z-20"
              >
                <button onClick={handleConfidence} className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-[1.25rem] sm:rounded-2xl border border-white/10 transition-all backdrop-blur-md group shadow-xl">
                  <span className="text-[28px] sm:text-[32px] group-hover:scale-110 transition-transform">😅</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 group-hover:text-rose-300 font-bold uppercase tracking-wider">Hard</span>
                </button>
                <button onClick={handleConfidence} className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 rounded-[1.25rem] sm:rounded-2xl border border-white/10 transition-all backdrop-blur-md group shadow-xl">
                  <span className="text-[28px] sm:text-[32px] group-hover:scale-110 transition-transform">🤔</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 group-hover:text-amber-300 font-bold uppercase tracking-wider">Good</span>
                </button>
                <button onClick={handleConfidence} className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 rounded-[1.25rem] sm:rounded-2xl border border-white/10 transition-all backdrop-blur-md group shadow-xl">
                   <span className="text-[28px] sm:text-[32px] group-hover:scale-110 transition-transform">😎</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 group-hover:text-emerald-300 font-bold uppercase tracking-wider">Easy</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Nav */}
        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="hidden md:flex shrink-0 w-14 h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed transition-all shadow-xl backdrop-blur-md absolute right-8 lg:right-16 z-20"
        >
          <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile Nav below */}
      <AnimatePresence>
        {!isFlipped && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex md:hidden absolute bottom-6 sm:bottom-10 left-0 right-0 justify-between px-6 z-20 pointer-events-none"
          >
             <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-0 transition-opacity backdrop-blur-md pointer-events-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
             <button
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-0 transition-opacity backdrop-blur-md pointer-events-auto"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
