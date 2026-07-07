import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Camera,
  Search,
  Sparkles,
  HelpCircle,
  Layers,
  FileCheck2,
  ArrowLeft,
  Bot,
  Globe,
  ChevronRight,
  Loader2,
  Target,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { InteractiveQuiz } from "./InteractiveQuiz";

export function MyNotes() {
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // For chat-based actions like Questions and Search
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile({
        name: selectedFile.name,
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + " MB",
      });
      setIsUploading(true);
      setActiveAction(null);
      setResult(null);
      setChatMessages([]);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to parse document");
        }

        const data = await response.json();
        setFileContent(data.text);
      } catch (error) {
        console.error("Error uploading file:", error);
        setFileContent("Error parsing document content.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const executeAIAction = async (
    actionId: string,
    promptInstruction: string,
  ) => {
    if (isUploading) return;
    setActiveAction(actionId);
    setChatMessages([]);
    setResult("");
    setIsProcessing(true);

    if (actionId === "questions" || actionId === "search") {
      setChatMessages([
        {
          role: "assistant",
          content:
            actionId === "questions"
              ? "Ask me anything about your notes! I'll scan the document and provide you with an exact answer."
              : "What would you like me to search the web for to supplement your readings?",
        },
      ]);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are Exambridge AI, an intelligent study assistant and Cambridge examiner. Your task is to assist the user based on their notes. Use knowledge of the Cambridge syllabus, and structure answers like a Cambridge mark scheme with concise, bulleted points and highlight key terminology.\n\nDOCUMENT CONTENT:\n"""\n${fileContent || "No text extracted."}\n"""`,
            },
            {
              role: "user",
              content: promptInstruction,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate with AI");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      let accumulatedResult = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") break;
              const data = JSON.parse(dataStr);
              if (data.content) {
                accumulatedResult += data.content;
                setResult(accumulatedResult);
              }
            } catch (e) {
              console.error("Error parsing stream:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setResult(
        "An error occurred while communicating with the AI. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isProcessing || isUploading) return;

    const newMessages: { role: "user" | "assistant"; content: string }[] = [
      ...chatMessages,
      { role: "user", content: chatInput },
    ];

    setChatMessages(newMessages);
    setChatInput("");
    setIsProcessing(true);

    let systemPrompt = `You are Exambridge AI, an intelligent study assistant and Cambridge examiner. The user is asking questions about their document. Structure answers like a Cambridge mark scheme with concise, bulleted points and highlight key terminology.\n\nDOCUMENT CONTENT:\n"""\n${fileContent || "No text extracted."}\n"""`;

    if (activeAction === "search") {
      systemPrompt = `You are Exambridge AI, an intelligent study assistant and Cambridge examiner. Use your knowledge of the Cambridge syllabus to answer queries that go beyond the document to supplement the user's reading. Be comprehensive. Structure answers like a Cambridge mark scheme with concise, bulleted points and highlight key terminology for maximum scoring. You can also reference the document if needed.\n\nDOCUMENT CONTENT:\n"""\n${fileContent || "No text extracted."}\n"""`;
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...newMessages],
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate with AI");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      setChatMessages([...newMessages, { role: "assistant", content: "" }]);

      let accumulatedContent = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") break;
              const data = JSON.parse(dataStr);
              if (data.content) {
                accumulatedContent += data.content;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = accumulatedContent;
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing stream:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "An error occurred while communicating with the AI. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const actions = [
    {
      id: "summarize",
      title: "Summarize",
      icon: <FileCheck2 className="w-5 h-5" />,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
      hoverBorder: "hover:border-emerald-400/50",
      onClick: () =>
        executeAIAction(
          "summarize",
          "Please provide a comprehensive summary of this document. Highlight the main ideas, key takeaways, and condense it into a brief overview.",
        ),
    },
    {
      id: "explain",
      title: "Explain",
      icon: <Sparkles className="w-5 h-5" />,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
      hoverBorder: "hover:border-purple-400/50",
      onClick: () =>
        executeAIAction(
          "explain",
          "Break down the complex concepts, difficult paragraphs, and jargon in this document into simpler, easier-to-understand terms. Rephrase the hardest parts.",
        ),
    },
    {
      id: "quiz",
      title: "Quiz",
      icon: <Target className="w-5 h-5" />,
      color: "text-rose-400",
      bgColor: "bg-rose-400/10",
      borderColor: "border-rose-400/20",
      hoverBorder: "hover:border-rose-400/50",
      onClick: () =>
        executeAIAction(
          "quiz",
          'Generate a quiz based directly on this text so I can test my understanding. Respond ONLY with a valid JSON array of question objects without any markdown formatting or code blocks. The format must be exactly like this example:\n[\n  {\n    "type": "mcq",\n    "question": "What is...?",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": "A",\n    "explanation": "..."\n  },\n  {\n    "type": "short",\n    "question": "Explain...",\n    "correctAnswer": "The answer should include...",\n    "explanation": "..."\n  }\n]',
        ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full flex flex-col relative z-10">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 md:w-10 md:h-10 text-cyan-500" />
            My Notes
          </h1>
          <p className="mt-2 text-zinc-400 text-sm md:text-base uppercase font-bold tracking-tight">
            Upload, scan, and supercharge your study materials.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setActiveAction(null);
              setResult(null);
            }}
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
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900/40 border-2 border-dashed ${isUploading ? "border-cyan-500/50 cursor-not-allowed opacity-50" : "border-zinc-700/50 hover:bg-zinc-900/80 hover:border-cyan-500/50"} rounded-3xl transition-all group group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]`}
              >
                <div
                  className={`w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 ${!isUploading ? "group-hover:scale-110 transition-transform group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10" : ""}`}
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
                <h3
                  className={`text-2xl font-black uppercase italic tracking-tighter mb-2 ${isUploading ? "text-cyan-400" : "text-zinc-200 group-hover:text-cyan-400"} transition-colors`}
                >
                  {isUploading ? "Parsing Document..." : "Upload Document"}
                </h3>
                <p className="text-zinc-500 font-medium text-center max-w-sm">
                  Drag and drop your PDFs, Word docs, or text files here, or
                  click to browse.
                </p>
              </button>

              <button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900/40 border-2 border-dashed ${isUploading ? "border-cyan-500/50 cursor-not-allowed opacity-50" : "border-zinc-700/50 hover:bg-zinc-900/80 hover:border-cyan-500/50"} rounded-3xl transition-all group group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]`}
              >
                <div
                  className={`w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 ${!isUploading ? "group-hover:scale-110 transition-transform group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10" : ""}`}
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  ) : (
                    <Camera className="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
                <h3
                  className={`text-2xl font-black uppercase italic tracking-tighter mb-2 ${isUploading ? "text-cyan-400" : "text-zinc-200 group-hover:text-cyan-400"} transition-colors`}
                >
                  {isUploading ? "Parsing Document..." : "Scan Notes"}
                </h3>
                <p className="text-zinc-500 font-medium text-center max-w-sm">
                  Take a photo of your handwritten notes or textbook pages for
                  instant AI OCR.
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
                  <h3 className="font-bold text-zinc-200 text-lg mb-1 truncate w-full px-4">
                    {file.name}
                  </h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    {file.size} • Uploaded just now
                  </p>
                </div>

                {/* AI Actions Grid */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 px-2">
                    AI Capabilities
                  </h4>
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      disabled={isUploading}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        isUploading
                          ? "opacity-50 cursor-not-allowed grayscale"
                          : ""
                      } ${
                        activeAction === action.id
                          ? `${action.bgColor} ${action.borderColor} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                          : `bg-zinc-900/50 border-zinc-800 ${action.hoverBorder} hover:bg-zinc-800/50`
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${action.bgColor} ${action.color}`}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h5
                          className={`font-bold uppercase text-sm tracking-tight ${activeAction === action.id ? "text-white" : "text-zinc-300"}`}
                        >
                          {action.title}
                        </h5>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 ${activeAction === action.id ? action.color : "text-zinc-600"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Results Area */}
              <div className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col relative h-full">
                {!activeAction ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                    <Bot className="w-16 h-16 text-zinc-700 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-300 mb-2">
                      Exambridge AI is ready
                    </h3>
                    <p className="text-zinc-500 max-w-sm">
                      Select an action on the left to summarize, analyze, or
                      generate study materials from your notes.
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex-[1_1_0%] relative flex flex-col p-4 md:p-8 overflow-y-auto min-h-0"
                  >
                    {/* Header */}
                    <div
                      className="flex items-center gap-4 border-zinc-800 sticky top-0 z-10 backdrop-blur shrink-0 pb-4 md:pb-6 mb-4 md:mb-6 border-b bg-transparent"
                    >
                      {actions.map(
                        (a) =>
                          a.id === activeAction && (
                            <div
                              key="header"
                              className="flex items-center gap-4 w-full shrink-0"
                            >
                              <div
                                className={`p-3 rounded-2xl ${a.bgColor} ${a.color} border ${a.borderColor}`}
                              >
                                {a.icon}
                              </div>
                              <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-100 leading-none">
                                  {a.title}
                                </h2>
                                <p className="text-zinc-500 font-medium text-sm">
                                  Processing based on {file.name}
                                </p>
                              </div>
                            </div>
                          ),
                      )}
                    </div>

                    {/* Content */}
                    <div className="w-full relative mt-4 md:mt-6">
                      {isProcessing && !result ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse h-full">
                          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                          <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
                            Analyzing Document...
                          </p>
                        </div>
                      ) : activeAction === "quiz" ? (
                        isProcessing ? (
                          <div className="flex flex-col items-center justify-center p-10 h-full text-center">
                            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
                              Generating Interactive Quiz...
                            </p>
                            <p className="text-zinc-500 text-xs mt-2">
                              Parsing content and crafting MCQs & short answers.
                            </p>
                          </div>
                        ) : (
                          (() => {
                            try {
                              const jsonMatch = result?.match(/\[[\s\S]*\]/);
                              if (jsonMatch) {
                                const questions = JSON.parse(jsonMatch[0]);
                                return (
                                  <InteractiveQuiz
                                    questions={questions}
                                    onRestart={() => setActiveAction(null)}
                                  />
                                );
                              }
                              return (
                                <p className="text-rose-500">
                                  Failed to generate quiz. No JSON array found.
                                  Please try again.
                                </p>
                              );
                            } catch (e) {
                              return (
                                <div className="p-4 w-full h-full overflow-y-auto">
                                  <p className="text-rose-500 mb-4 font-bold">
                                    Error parsing quiz JSON. Raw output:
                                  </p>
                                  <div className="text-xs text-zinc-500 whitespace-pre-wrap">
                                    {result}
                                  </div>
                                </div>
                              );
                            }
                          })()
                        )
                      ) : result ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/20 p-6 rounded-2xl border border-white/5 h-full overflow-y-auto prose prose-invert prose-zinc max-w-none"
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
