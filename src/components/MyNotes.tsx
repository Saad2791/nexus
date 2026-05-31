import { useState, useRef } from 'react';
import { FileText, Upload, Camera, Search, Sparkles, HelpCircle, Layers, FileCheck2, ArrowLeft, Bot, Globe, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

export function MyNotes() {
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile({
        name: e.target.files[0].name,
        size: (e.target.files[0].size / 1024 / 1024).toFixed(2) + ' MB'
      });
      setActiveAction(null);
      setResult(null);
    }
  };

  const simulateProcessing = (actionName: string, simulatedResult: string) => {
    setActiveAction(actionName);
    setIsProcessing(true);
    setResult(null);
    
    // Simulate AI processing delay
    setTimeout(() => {
      setResult(simulatedResult);
      setIsProcessing(false);
    }, 2000);
  };

  const actions = [
    {
      id: 'summarize',
      title: 'Summarize',
      icon: <FileCheck2 className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      hoverBorder: 'hover:border-emerald-400/50',
      onClick: () => simulateProcessing('summarize', "#### Executive Summary\n\n- The respiratory system facilitates gas exchange.\n- Primary organs include lungs, trachea, and bronchi.\n- Cellular respiration uses oxygen to produce ATP, releasing CO2 as a byproduct.\n\n*Key takeaway: Oxygen intake is intrinsically linked to cellular energy production.*")
    },
    {
      id: 'explain',
      title: 'Explain',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      hoverBorder: 'hover:border-purple-400/50',
      onClick: () => simulateProcessing('explain', "#### Concept Breakdown\n\nImagine the lungs like an upside-down tree. The **trachea** is the trunk, splitting into branches called **bronchi**, which divide into tiny twigs called **bronchioles**.\nAt the very tips are **alveoli** (like leaves) where the actual magic of swapping oxygen for carbon dioxide happens with the surrounding blood vessels.")
    },
    {
      id: 'flashcards',
      title: 'Create Flashcards',
      icon: <Layers className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/20',
      hoverBorder: 'hover:border-orange-400/50',
      onClick: () => simulateProcessing('flashcards', "**Q: What is the main function of alveoli?**\n*A: To maximize surface area for gas exchange between the lungs and the bloodstream.*\n\n---\n\n**Q: What is ATP?**\n*A: Adenosine Triphosphate, the primary energy carrier in cells.*")
    },
    {
      id: 'questions',
      title: 'Ask Questions',
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      hoverBorder: 'hover:border-blue-400/50',
      onClick: () => simulateProcessing('questions', "I've analyzed the notes. Here are some potential questions you could be asked in an exam:\n\n1. Describe the pathway of an oxygen molecule from the nasal cavity to an alveolus.\n2. Explain the role of the diaphragm in negative pressure breathing.\n3. How would asthma affect the structures mentioned in this text? \n\n*Want me to quiz you on these?*")
    },
    {
      id: 'search',
      title: 'Search Web',
      icon: <Globe className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/20',
      hoverBorder: 'hover:border-cyan-400/50',
      onClick: () => simulateProcessing('search', "#### Relevant Web Discoveries\n\nFound 3 recent articles complementing your notes:\n\n- **[Nature]** *New insights into alveolar gas exchange efficiency...*\n- **[Khan Academy]** *Video: The Respiratory System in detail...*\n- **[MedlinePlus]** *Common disorders of the bronchial tubes...*\n\nWould you like me to integrate the findings from the Nature article into your current notes?")
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full flex flex-col relative z-10">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 md:w-10 md:h-10 text-cyan-500" />
            My Notes
          </h1>
          <p className="mt-2 text-zinc-400 text-sm md:text-base uppercase font-bold tracking-tight">Upload, scan, and supercharge your study materials.</p>
        </div>
        
        {file && (
          <button 
            onClick={() => { setFile(null); setActiveAction(null); setResult(null); }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            New File
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col md:flex-row gap-6"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,image/*"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900/40 border-2 border-dashed border-zinc-700/50 rounded-3xl hover:bg-zinc-900/80 hover:border-cyan-500/50 transition-all group group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 group-hover:scale-110 transition-transform group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10">
                  <Upload className="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-200 mb-2 group-hover:text-cyan-400 transition-colors">Upload Document</h3>
                <p className="text-zinc-500 font-medium text-center max-w-sm">
                  Drag and drop your PDFs, Word docs, or text files here, or click to browse.
                </p>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900/40 border-2 border-dashed border-zinc-700/50 rounded-3xl hover:bg-zinc-900/80 hover:border-cyan-500/50 transition-all group group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 group-hover:scale-110 transition-transform group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10">
                  <Camera className="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-200 mb-2 group-hover:text-cyan-400 transition-colors">Scan Notes</h3>
                <p className="text-zinc-500 font-medium text-center max-w-sm">
                  Take a photo of your handwritten notes or textbook pages for instant AI OCR.
                </p>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col md:flex-row gap-6 h-full overflow-hidden"
            >
              {/* Left Column: File Preview & Actions */}
              <div className="w-full md:w-1/3 flex flex-col gap-6 shrink-0 h-full overflow-y-auto hide-scrollbar pb-6 rounded-3xl">
                {/* File Info */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center text-center shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-zinc-200 text-lg mb-1 truncate w-full px-4">{file.name}</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{file.size} • Uploaded just now</p>
                </div>

                {/* AI Actions Grid */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 px-2">AI Capabilities</h4>
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        activeAction === action.id 
                          ? `${action.bgColor} ${action.borderColor} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                          : `bg-zinc-900/50 border-zinc-800 ${action.hoverBorder} hover:bg-zinc-800/50`
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${action.bgColor} ${action.color}`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className={`font-bold uppercase text-sm tracking-tight ${activeAction === action.id ? 'text-white' : 'text-zinc-300'}`}>
                          {action.title}
                        </h5>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${activeAction === action.id ? action.color : 'text-zinc-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Results Area */}
              <div className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col relative h-full">
                {!activeAction ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                     <Bot className="w-16 h-16 text-zinc-700 mb-4" />
                     <h3 className="text-xl font-bold text-zinc-300 mb-2">Nexus AI is ready</h3>
                     <p className="text-zinc-500 max-w-sm">Select an action on the left to summarize, analyze, or generate study materials from your notes.</p>
                  </div>
                ) : (
                  <div className="flex-[1_1_0%] overflow-y-auto p-6 md:p-8 relative">
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-zinc-800 pb-6 mb-6 sticky top-0 bg-zinc-900/95 z-10 backdrop-blur">
                       {actions.map(a => a.id === activeAction && (
                         <div key="header" className="flex items-center gap-4 w-full">
                           <div className={`p-3 rounded-2xl ${a.bgColor} ${a.color} border ${a.borderColor}`}>
                             {a.icon}
                           </div>
                           <div>
                             <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-100 leading-none">{a.title}</h2>
                             <p className="text-zinc-500 font-medium text-sm">Processing based on {file.name}</p>
                           </div>
                         </div>
                       ))}
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-zinc max-w-none">
                      {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                          <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Analyzing Document...</p>
                        </div>
                      ) : result ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/20 p-6 rounded-2xl border border-white/5"
                        >
                          <Markdown>{result}</Markdown>
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

