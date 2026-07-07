import React, { useState, useRef } from 'react';
import { BrainCircuit, CheckSquare, FileText, Send, Loader2, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SmartMarking() {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [markSchemeFile, setMarkSchemeFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  const questionInputRef = useRef<HTMLInputElement>(null);
  const markSchemeInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState('');
  
  const handleEvaluate = async () => {
    if (!answerFile) return;
    
    setIsEvaluating(true);
    setResult('');
    
    try {
      const formData = new FormData();

      // Append files explicitly with field names so the backend can distinguish them if it chooses to
      if (questionFile) formData.append('questionFile', questionFile);
      if (markSchemeFile) formData.append('markSchemeFile', markSchemeFile);
      if (answerFile) formData.append('answerFile', answerFile);

      const response = await fetch('/api/ai/mark', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errMessage = 'Server returned an error';
        try {
          const body = await response.json();
          errMessage = body.error || errMessage;
        } catch (e) {
          // not json
        }
        throw new Error(errMessage);
      }

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.content) {
                setResult(prev => prev + data.content);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Evaluation error:", error);
      setResult(prev => prev + `\n\n**Error evaluating answer**: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const clearFile = (type: 'question' | 'markScheme' | 'answer') => {
    if (type === 'question') setQuestionFile(null);
    if (type === 'markScheme') setMarkSchemeFile(null);
    if (type === 'answer') setAnswerFile(null);
  };

  const FileBadge = ({ file, onClear }: { file: File | null, onClear: () => void }) => {
    if (!file) return null;
    return (
      <div className="flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs py-1.5 px-3 rounded-lg w-fit">
        <Paperclip className="w-3 h-3" />
        <span className="truncate max-w-[150px]">{file.name}</span>
        <button onClick={onClear} className="ml-1 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full flex flex-col relative z-10">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl md:text-5xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3 mb-2">
            <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
            Smart Marking
          </h1>
          <p className="mt-2 text-blue-200/50 text-sm md:text-base uppercase font-bold tracking-widest">SaadGPT Artificial Examiner</p>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-0 pb-10">
        {/* Left: Input Form */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto custom-scrollbar pr-2 lg:pr-4">
           <div className="bg-[#1b213b]/40 border border-blue-500/20 rounded-[2rem] p-6 lg:p-8 flex flex-col gap-6">
              
              <div>
                <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                   <FileText className="w-3.5 h-3.5" /> Exam Question Image/PDF
                </label>
                <div 
                  onClick={() => questionInputRef.current?.click()}
                  className="w-full bg-[#0b0f19] border border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl px-4 py-6 text-white/50 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <input 
                    type="file" 
                    ref={questionInputRef}
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files && setQuestionFile(e.target.files[0])}
                  />
                  <Paperclip className="w-6 h-6 mb-2 text-blue-400/50" />
                  <span className="text-xs">Click to upload question</span>
                </div>
                <FileBadge file={questionFile} onClear={() => clearFile('question')} />
              </div>

              <div>
                <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                   <FileText className="w-3.5 h-3.5" /> Mark Scheme Image/PDF (Optional)
                </label>
                <div 
                  onClick={() => markSchemeInputRef.current?.click()}
                  className="w-full bg-[#0b0f19] border border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl px-4 py-6 text-white/50 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <input 
                    type="file" 
                    ref={markSchemeInputRef}
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files && setMarkSchemeFile(e.target.files[0])}
                  />
                  <Paperclip className="w-6 h-6 mb-2 text-blue-400/50" />
                  <span className="text-xs">Click to upload mark scheme</span>
                </div>
                <FileBadge file={markSchemeFile} onClear={() => clearFile('markScheme')} />
              </div>

              <div>
                <label className="block text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                   <FileText className="w-3.5 h-3.5" /> Student Answer Image/PDF
                </label>
                <div 
                  onClick={() => answerInputRef.current?.click()}
                  className="w-full bg-[#0b0f19] border border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-xl px-4 py-6 text-emerald-100/50 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <input 
                    type="file" 
                    ref={answerInputRef}
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files && setAnswerFile(e.target.files[0])}
                  />
                  <Paperclip className="w-6 h-6 mb-2 text-emerald-400/50" />
                  <span className="text-xs">Click to upload student answer</span>
                </div>
                <FileBadge file={answerFile} onClear={() => clearFile('answer')} />
              </div>

              <button 
                onClick={handleEvaluate}
                disabled={!answerFile || isEvaluating}
                className="mt-2 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isEvaluating ? 'Evaluating...' : 'Mark Answer'}
              </button>

           </div>
        </div>

        {/* Right: Results Display */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#0b0f19] border border-white/5 rounded-[2rem] p-6 lg:p-8 overflow-y-auto custom-scrollbar relative shadow-2xl h-[500px] lg:h-auto">
           {!result && !isEvaluating ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <BrainCircuit className="w-16 h-16 text-blue-400 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Ready for Marking</h3>
                <p className="text-sm font-medium px-4">Enter the question and student answer or upload images/PDFs to receive instant Cambridge-style feedback.</p>
             </div>
           ) : (
             <div className="prose prose-invert prose-blue max-w-none w-full markdown-body">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                 {result}
               </ReactMarkdown>
               {isEvaluating && (
                 <div className="flex items-center gap-2 mt-4 text-blue-400 text-sm font-medium animate-pulse">
                   <Loader2 className="w-4 h-4 animate-spin" /> Typing analysis...
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
