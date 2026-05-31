import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, FileText, Bot, PenTool, CheckCircle2, ChevronRight, Maximize2, Database, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import Markdown from 'react-markdown';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { Paper } from '../data/papers';
import { supabase } from '../lib/supabase';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PaperSolver({ paper, onExit }: { paper: Paper; onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'ai'>('workspace');
  const [activePdfType, setActivePdfType] = useState<'qp' | 'ms' | 'in' | 'gt' | 'er'>('qp');
  const [answerContent, setAnswerContent] = useState('');
  
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'missing_keys'>('checking');
  const [bucketError, setBucketError] = useState<string | null>(null);
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.2);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  type Message = { role: 'user' | 'assistant'; content: string };
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [userContext, setUserContext] = useState('');

  const askAi = async (promptText: string, contextPrepend: string = "") => {
    setIsLoadingAi(true);
    const newHistory = [...chatHistory, { role: 'user' as const, content: promptText }];
    setChatHistory(newHistory);
    
    try {
       const systemPrompt = `You are an expert Cambridge IGCSE / O Level examiner and AI tutor. 
You are currently helping a student with ${paper.subjectName} (${paper.subjectCode}), Paper ${paper.paperCode}, ${paper.season} ${paper.year}. 
Be concise, encouraging, and highly specific to the mark scheme. Guide the student towards the answer without simply giving it away unless asked.`;
       
       const messages = [
         { role: 'system', content: systemPrompt },
         ...newHistory.map(m => ({ 
           role: m.role, 
           content: m.role === 'user' && contextPrepend ? `Context: ${contextPrepend}\n\nUser Question: ${m.content}` : m.content 
         }))
       ];

       const res = await fetch('/api/ai/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ messages })
       });

       if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || "Failed to connect to AI server");
       }
       
       const reader = res.body?.getReader();
       const decoder = new TextDecoder();
       let assistantMsg = '';
       let buffer = '';
       
       setChatHistory([...newHistory, { role: 'assistant', content: '' }]);
       setIsLoadingAi(false); // Map to reading phase
       
       if (reader) {
         while (true) {
           const { value, done } = await reader.read();
           if (done) break;
           buffer += decoder.decode(value, { stream: true });
           const lines = buffer.split('\n');
           buffer = lines.pop() || '';
           
           for (const line of lines) {
             const trimmed = line.trim();
             if (trimmed.startsWith('data: ')) {
               const dataStr = trimmed.slice(6);
               if (dataStr === '[DONE]') break;
               try {
                 const data = JSON.parse(dataStr);
                 assistantMsg += data.content;
                 setChatHistory([...newHistory, { role: 'assistant', content: assistantMsg }]);
               } catch (e) {}
             }
           }
         }
       }
    } catch (e: any) {
       setChatHistory((prev) => {
         const last = prev[prev.length - 1];
         const errMsg = `Error: ${e.message}. Did you configure NVIDIA_API_KEY?`;
         if (last && last.role === 'assistant' && last.content === '') {
           return [...prev.slice(0, -1), { role: 'assistant', content: errMsg }];
         }
         return [...prev, { role: 'assistant', content: errMsg }];
       });
    } finally {
       setIsLoadingAi(false);
    }
  };

  const handleRunGradingSimulation = () => {
    if (!answerContent.trim()) return;
    setActiveTab('ai');
    askAi("Please grade my answer. Give me brief feedback on what I did right, what I missed, and what mark out of the total I would likely get.", `The student's drafted answer is: "${answerContent.trim()}"\n\n`);
  };

  const currentPdfUrl = React.useMemo(() => {
    if (activePdfType === 'qp') return paper.pdfUrl;
    if (activePdfType === 'ms') return paper.markSchemeUrl;
    if (activePdfType === 'in') return paper.inUrl;
    if (activePdfType === 'gt') return paper.gtUrl;
    if (activePdfType === 'er') return paper.erUrl;
    return paper.pdfUrl;
  }, [paper, activePdfType]);

  useEffect(() => {
    if (pdfContainerRef.current) {
      setPdfContainerWidth(pdfContainerRef.current.clientWidth);
    }
    
    const handleResize = () => {
      if (pdfContainerRef.current) {
        setPdfContainerWidth(pdfContainerRef.current.clientWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    if (!supabase) {
      setDbStatus('missing_keys');
      return;
    }
    setDbStatus('connected');
  }, [paper]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setLocalPdfUrl(url);
    } else {
      alert('Please drop a valid .pdf file.');
    }
  };

  return createPortal(
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-[#0A0A0C] text-zinc-100 font-sans"
    >
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors font-black uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Session
          </button>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(6,182,212,0.2)]">LIVE</span>
            <span className="font-bold uppercase tracking-widest text-sm">{paper.subjectName} • PAPER {paper.paperCode}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-cyan-400 font-mono font-bold shadow-inner">
            <Clock className="w-4 h-4" />
            01:15:42
          </div>
          <button className="bg-cyan-500 text-black px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Submit Paper
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Document Viewer Placeholder */}
        <div 
          className="flex-1 bg-zinc-950 p-6 flex flex-col relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex-[0_0_auto] flex justify-between items-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Database className={`w-4 h-4 ${dbStatus === 'connected' ? 'text-cyan-400' : 'text-zinc-600'}`} />
              {localPdfUrl ? 'Local PDF Preview Mode' : (dbStatus === 'connected' ? 'Supabase Connected' : 'Supabase Not Connected')}
            </span>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
              {[
                { id: 'qp', label: 'QP', url: paper.pdfUrl, title: 'Question Paper' },
                { id: 'ms', label: 'MS', url: paper.markSchemeUrl, title: 'Mark Scheme' },
                { id: 'in', label: 'IN', url: paper.inUrl, title: 'Insert' },
                { id: 'gt', label: 'GT', url: paper.gtUrl, title: 'Grade Thresholds' },
                { id: 'er', label: 'ER', url: paper.erUrl, title: 'Examiner Report' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.url && setActivePdfType(tab.id as any)}
                  disabled={!tab.url}
                  title={tab.title}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${!tab.url ? 'opacity-20 cursor-not-allowed' : activePdfType === tab.id ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <a 
                href={currentPdfUrl || paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-zinc-800 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors" 
              >
                Open Original PDF
              </a>
              <button className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Expand View">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className={`flex-1 border-2 ${isDragging ? 'border-cyan-500 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-950'} rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300 ${!localPdfUrl && !currentPdfUrl ? 'items-center justify-center text-center' : ''}`}>
            {isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                <div className="text-cyan-400 font-black uppercase tracking-widest text-xl flex flex-col items-center gap-4">
                  <FileText className="w-12 h-12 animate-bounce" />
                  Drop downloaded PDF to view
                </div>
              </div>
            )}
            
            {dbStatus === 'missing_keys' && !localPdfUrl && (
              <div className="p-12 h-full flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_transparent_60%)] opacity-20 pointer-events-none" />
                <FileText className="w-20 h-20 text-zinc-700 mb-6 group-hover:text-cyan-400 transition-colors mx-auto" />
                <h2 className="text-3xl font-black uppercase italic mb-2">Supabase PDF Bucket</h2>
                <p className="text-zinc-500 font-bold max-w-lg mx-auto uppercase tracking-wide leading-relaxed text-sm mb-6">
                  Please add your Supabase URL and Anon Key to the .env file to enable the PDF viewer.
                </p>
              </div>
            )}

            {dbStatus === 'connected' && bucketError && !localPdfUrl && (
              <div className="p-12 h-full flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-6 mx-auto" />
                <h2 className="text-2xl font-black uppercase italic mb-2 text-rose-400">Storage Error</h2>
                <p className="text-zinc-500 font-bold max-w-lg mx-auto uppercase tracking-wide leading-relaxed text-sm">
                  {bucketError}
                </p>
                <div className="mt-8 bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-left max-w-md shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Troubleshooting</span>
                  <ul className="text-xs text-zinc-400 font-medium space-y-2 list-disc list-inside">
                    <li>Is the `<span className="text-cyan-400">past-papers</span>` bucket set to <strong>Public</strong> in Supabase?</li>
                    <li>Does this specific paper's PDF exist in the correct subfolders?</li>
                  </ul>
                </div>
              </div>
            )}
            
            {(localPdfUrl || (currentPdfUrl && !bucketError && dbStatus === 'connected')) && (
              <div ref={pdfContainerRef} className="w-full h-full overflow-auto bg-zinc-900 absolute inset-0 z-10">
                <Document
                  file={localPdfUrl || currentPdfUrl!}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => setBucketError(`Failed to load PDF: ${error.message}`)}
                  loading={
                    <div className="flex flex-col items-center justify-center p-12">
                      <Clock className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                      <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">Parsing Document...</p>
                    </div>
                  }
                  className="flex flex-col items-center w-full"
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <div key={`page_${index + 1}`} className="mb-4 shadow-xl last:mb-0">
                      <Page
                        pageNumber={index + 1}
                        width={pdfContainerWidth ? pdfContainerWidth * scale : undefined}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="bg-white"
                      />
                    </div>
                  ))}
                </Document>

                {/* Zoom Controls Overlay */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:-translate-x-0 md:left-10 bg-zinc-900 border border-zinc-700 p-2 rounded-full shadow-2xl flex items-center gap-2 z-50">
                  <button 
                    onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-zinc-300 w-12 text-center">{Math.round(scale * 100)}%</span>
                  <button 
                    onClick={() => setScale(s => Math.min(3, s + 0.2))}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {dbStatus === 'connected' && !bucketError && !currentPdfUrl && !localPdfUrl && (
               <div className="p-12 h-full flex flex-col items-center justify-center text-center">
                 <Clock className="w-12 h-12 text-cyan-500 animate-spin mb-4 mx-auto" />
                 <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">Loading Paper from Database...</p>
               </div>
            )}

            {!localPdfUrl && dbStatus === 'connected' && (
              <div className="absolute bottom-6 mx-auto inset-x-0 w-max bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full shadow-2xl z-20 pointer-events-none">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Paper Missing? <span className="text-cyan-400">Drag & Drop</span> a local PDF here as a fallback.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Grading & AI Workspace */}
        <div className="w-[450px] border-l border-zinc-800 flex flex-col bg-zinc-900/50 relative">
          <div className="flex px-4 pt-4 border-b border-zinc-800 gap-4">
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'workspace' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <PenTool className="w-4 h-4" /> Workspace
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'ai' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Bot className="w-4 h-4" /> AI Examiner
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col hide-scrollbar relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'workspace' ? (
                <motion.div 
                  key="workspace"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col"
                >
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Semantic Answer Editor</span>
                  <textarea 
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="TYPE YOUR ANSWER HERE TO BE SEMANTICALLY GRADED..."
                    className="w-full flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 font-bold text-zinc-200 resize-none focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700 shadow-inner"
                  />
                  <button 
                    onClick={handleRunGradingSimulation}
                    disabled={!answerContent.trim()}
                    className="mt-4 w-full py-4 bg-zinc-800 border border-zinc-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Run Grading Simulation
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 mb-4 shadow-lg flex gap-4 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase italic text-sm text-zinc-200">AI EXAMINER ACTIVE</h4>
                      <p className="text-zinc-400 text-xs font-bold leading-relaxed mt-1 tracking-wide">
                        I am monitoring your answers against the <span className="text-cyan-400">{paper.year} mark scheme</span>. Need a hint or explanation?
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar flex flex-col mb-4">
                    {chatHistory.length === 0 ? (
                      <div className="space-y-2 mt-4">
                        {['Explain this concept simpler', 'What does the mark scheme look for?', 'Generate a related practice question'].map(prompt => (
                          <button 
                            key={prompt}
                            onClick={() => askAi(prompt)}
                            className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-500/50 transition-colors group text-left"
                          >
                            <span className="font-bold text-xs uppercase tracking-widest text-zinc-400 group-hover:text-cyan-400 transition-colors">{prompt}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-900/50 border border-cyan-500/30 text-cyan-100 rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'}`}>
                            {msg.role === 'assistant' && <Bot className="w-4 h-4 text-cyan-500 mb-2" />}
                            <div className="text-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                              {msg.role === 'assistant' ? (
                                <Markdown>{msg.content}</Markdown>
                              ) : (
                                msg.content.split('\n').map((line, idx) => <span key={idx}>{line}<br/></span>)
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isLoadingAi && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm">
                          <Bot className="w-4 h-4 text-cyan-500 mb-2 animate-pulse" />
                          <div className="flex gap-1.5 items-center mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 mt-auto pt-4 relative bg-transparent">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (userContext.trim() && !isLoadingAi) {
                          askAi(userContext.trim());
                          setUserContext('');
                        }
                      }}
                      className="relative bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors flex flex-col"
                    >
                      <textarea
                        value={userContext}
                        onChange={(e) => {
                          setUserContext(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (userContext.trim() && !isLoadingAi) {
                              askAi(userContext.trim());
                              setUserContext('');
                              e.currentTarget.style.height = 'auto';
                            }
                          }
                        }}
                        rows={1}
                        placeholder="Message Examiner..."
                        className="w-full bg-transparent border-none pl-4 pr-12 py-4 font-medium text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-500 resize-none min-h-[52px] hide-scrollbar"
                        style={{ overflowY: 'auto' }}
                      />
                      <div className="flex justify-end p-2 pb-2.5 pt-0 bg-transparent">
                        <button 
                          type="button"
                          disabled={!userContext.trim() || isLoadingAi}
                          className="p-2 justify-center items-center flex bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:shadow-none"
                          onClick={() => {
                            if (userContext.trim() && !isLoadingAi) {
                              askAi(userContext.trim());
                              setUserContext('');
                              const ta = document.querySelector('textarea[placeholder="Message Examiner..."]') as HTMLTextAreaElement;
                              if (ta) ta.style.height = 'auto';
                            }
                          }}
                        >
                          <ChevronRight className="w-4 h-4 ml-0.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
