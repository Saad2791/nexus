import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Send, Paperclip, Bot, User } from 'lucide-react';
import Markdown from 'react-markdown';

export function AITutor() {
  type Message = { role: 'user' | 'assistant'; content: string };
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Exambridge AI Tutor. What are we studying today? You can ask me to explain a concept, generate a quiz, or upload a mark scheme for analysis." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: "You are the Exambridge AI Tutor, an expert Cambridge IGCSE and O Level examiner and revision coach. You provide concise, engaging, and highly accurate explanations, quizzes, and study tips for students. Ensure your explanations closely adhere to the Cambridge syllabus. When explaining concepts or answering questions, structure your responses like an official Cambridge mark scheme (using clear bullet points, highlighting key scoring terminology, and showing exactly where marks are awarded)." },
            ...newMessages
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Network error");
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let buffer = '';
      
      setMessages([...newMessages, { role: 'assistant', content: '' }]);
      setIsLoading(false); // Stop loading spinner

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
                setMessages([...newMessages, { role: 'assistant', content: assistantMsg }]);
              } catch (e) {}
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        // If we already started an assistant msg, append to it. Else create new.
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
           return [...prev.slice(0, -1), { role: 'assistant', content: `Sorry, I encountered an error. Did you link the NVIDIA_API_KEY? Error: ${err.message}` }];
        }
        return [...prev, { role: 'assistant', content: `Sorry, I encountered an error. Did you link the NVIDIA_API_KEY? Error: ${err.message}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 mx-auto w-full max-w-[95%] h-full flex flex-col pb-4 md:pb-6 relative z-10">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3 mb-2">
            <BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" />
            AI COACH
          </h1>
          <p className="mt-1 text-zinc-400 text-xs md:text-sm uppercase font-bold tracking-tight">Your personal examiner & revision coach.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden text-sm relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-2 md:px-6 pt-4 pb-12 space-y-8 hide-scrollbar">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[90%] md:max-w-[80%] break-words ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center border ${msg.role === 'user' ? 'bg-zinc-800 border-zinc-700 font-bold italic text-white text-xs' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                {msg.role === 'user' ? 'U' : <Bot className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className={`p-4 rounded-3xl leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-white font-bold rounded-tr-sm' 
                  : 'bg-transparent text-zinc-300 prose prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-zinc-800/50 max-w-full rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? <Markdown>{msg.content}</Markdown> : msg.content.split('\n').map((l, j) => <span key={j}>{l}<br/></span>)}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[80%] px-2 md:px-6"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center border bg-cyan-500/10 border-cyan-500/20">
                <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="p-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Suggestions */}
        {messages.length === 1 && (
          <div className="px-2 md:px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
            {['Explain Recursion like I am 10', 'Generate hardest CS 2210 questions', 'Create a study plan for Math 0580'].map((suggestion) => (
              <button 
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="whitespace-nowrap px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 hover:border-cyan-500/30 transition-colors text-zinc-400 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="px-2 md:px-6 shrink-0 z-20">
          <div className="relative flex flex-col bg-zinc-900 border border-zinc-700/50 rounded-3xl shadow-2xl overflow-hidden focus-within:border-cyan-500/50 transition-colors">
            <textarea 
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.currentTarget.style.height = 'auto';
                }
              }}
              placeholder="Message AI Coach..." 
              rows={1}
              className="w-full bg-transparent border-none min-h-[56px] py-4 pl-4 pr-16 focus:outline-none transition-colors font-medium text-base placeholder:text-zinc-600 resize-none hide-scrollbar text-zinc-200"
              style={{ overflowY: 'auto' }}
            />
            <div className="flex justify-between items-center px-3 pb-3 pt-1">
              <button className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors rounded-full hover:bg-zinc-800/50">
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  handleSend();
                  const ta = document.querySelector('textarea');
                  if (ta) ta.style.height = 'auto';
                }}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-cyan-500 text-black rounded-full hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-3 font-medium text-[10px] text-zinc-600">
            Exambridge AI can make mistakes. Always verify with official mark schemes.
          </div>
        </div>
      </div>
    </div>
  );
}
