import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type QuizQuestion = {
  type: "mcq" | "short";
  question: string;
  options?: string[]; // strictly for mcq
  correctAnswer: string; // for mcq it's the exact string of the option, for short it's the model answer criteria
  explanation: string;
};

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  onRestart: () => void;
}

export function InteractiveQuiz({
  questions,
  onRestart,
}: InteractiveQuizProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showGrading, setShowGrading] = useState(false);
  const [shortAnswerText, setShortAnswerText] = useState("");

  const handleNext = () => {
    if (questions[currentQuestionIdx].type === "short") {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIdx]: shortAnswerText,
      }));
      setShortAnswerText("");
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setShowGrading(true);
    }
  };

  const handleSelectOption = (option: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIdx]: option }));
  };

  if (showGrading) {
    let score = 0;
    questions.forEach((q, idx) => {
      if (q.type === "mcq" && userAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });

    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col">
        <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-3xl p-8 backdrop-blur-xl mb-8 text-center">
          <TrophyIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">
            Quiz Completed!
          </h2>
          <p className="text-zinc-400 font-medium">
            You finished the quiz. Let's see how you did.
          </p>
          <div className="mt-6 flex flex-col items-center">
            <div className="text-6xl font-black text-cyan-500">
              {score}
              <span className="text-3xl text-zinc-600">
                /{questions.filter((q) => q.type === "mcq").length}
              </span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mt-2">
              MCQ Score
            </p>
          </div>
          <p className="text-zinc-500 text-sm mt-4 italic">
            *Short answers require self-review against the provided criteria
            below.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isCorrect =
              q.type === "mcq" && userAnswers[idx] === q.correctAnswer;

            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${q.type === "mcq" ? (isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20") : "bg-zinc-900 border-zinc-800"}`}
              >
                <div className="flex gap-4">
                  <div className="shrink-0 pt-1">
                    {q.type === "mcq" ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )
                    ) : (
                      <Layers className="w-6 h-6 text-cyan-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-lg text-zinc-200 mb-4">
                      {idx + 1}. {q.question}
                    </p>

                    <div className="mb-4">
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
                        Your Answer:
                      </p>
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300 whitespace-pre-wrap font-medium">
                        {userAnswers[idx] || (
                          <span className="text-zinc-700 italic">
                            No answer provided
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-bold uppercase tracking-widest text-emerald-500/80 mb-2">
                        Model Answer / Criteria:
                      </p>
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-200 whitespace-pre-wrap font-medium">
                        {q.correctAnswer}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
                        Explanation:
                      </p>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition-colors uppercase tracking-widest text-sm font-bold rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Start Over
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="w-full flex justify-center">
      <div className="w-full flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-3xl overflow-hidden relative">
        {/* Top Header */}
        <div className="p-3 md:p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex justify-between items-center shrink-0">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-sm">
            {currentQ.type === "mcq" ? "Multiple Choice" : "Short Answer"}
          </span>
        </div>

        {/* Question Content Area */}
        <div className="p-4 md:p-6 flex flex-col relative justify-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-full max-w-3xl mx-auto"
            >
              <h3 className="text-lg md:text-xl font-bold text-zinc-100 mb-4 md:mb-6 leading-relaxed text-center text-balance shrink-0">
                {currentQ.question}
              </h3>

              {currentQ.type === "mcq" && currentQ.options ? (
                <div className="flex flex-col space-y-2.5 w-full">
                  {currentQ.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(option)}
                      className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all group ${
                        userAnswers[currentQuestionIdx] === option
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-300"
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div
                          className={`w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                            userAnswers[currentQuestionIdx] === option
                              ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                              : "border-zinc-700/50 text-zinc-500 bg-zinc-900 group-hover:border-zinc-600 group-hover:text-zinc-400"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="font-medium text-sm md:text-base leading-snug">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-3 w-full h-full min-h-[120px]">
                  <textarea
                    value={shortAnswerText}
                    onChange={(e) => setShortAnswerText(e.target.value)}
                    placeholder="Type your detailed answer here..."
                    className="w-full flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5 text-zinc-200 font-medium placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none text-sm md:text-base"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Actions Area */}
        <div className="p-3 md:p-4 bg-zinc-900/60 border-t border-zinc-800/80 flex justify-end shrink-0">
          <button
            onClick={handleNext}
            disabled={
              currentQ.type === "mcq"
                ? !userAnswers[currentQuestionIdx]
                : shortAnswerText.trim() === ""
            }
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black uppercase tracking-widest text-[10px] md:text-xs font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:shadow-none"
          >
            {currentQuestionIdx < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
