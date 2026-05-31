import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Play, Folder, ChevronRight, BookOpen, Clock, Loader2 } from 'lucide-react';
import { type Paper, type SubjectFolder, type YearSeasonFolder, fetchAvailableSubjects, fetchAvailableYears, fetchAvailablePapers } from '../data/papers';
import { PaperSolver } from './PaperSolver';

export function PastPapers() {
  const [subjects, setSubjects] = useState<SubjectFolder[]>([]);
  const [yearsFolders, setYearsFolders] = useState<YearSeasonFolder[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<SubjectFolder | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [solvingPaper, setSolvingPaper] = useState<Paper | null>(null);
  const [debugFiles, setDebugFiles] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAvailableSubjects().then(res => {
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSubjects(res.subjects.sort((a,b) => a.name.localeCompare(b.name)));
      }
      setLoading(false);
    });
  }, []);

  const handleSelectSubject = async (sub: SubjectFolder) => {
    setSelectedSubject(sub);
    setSelectedYear(null);
    setPapers([]);
    setLoading(true);
    const yrs = await fetchAvailableYears(sub.folderName);
    setYearsFolders(yrs);
    setLoading(false);
  };

  const handleSelectYear = async (year: number) => {
    setSelectedYear(year);
    if (!selectedSubject) return;
    
    setLoading(true);
    const seasonFolders = yearsFolders.filter(y => y.year === year);
    const allPapersForYear: Paper[] = [];
    const allRawFiles: string[] = [];
    
    for (const folder of seasonFolders) {
       const res = await fetchAvailablePapers(selectedSubject.folderName, folder.folderName, selectedSubject.code, selectedSubject.name);
       allPapersForYear.push(...res.papers);
       allRawFiles.push(...res.rawList.map(name => `${folder.folderName}/${name}`));
    }
    
    console.log("Papers computed:", allPapersForYear);
    setPapers(allPapersForYear);
    setDebugFiles(allRawFiles);
    setLoading(false);
  };

  const uniqueYears = useMemo(() => {
    const ySet = new Set<number>(yearsFolders.map(y => y.year));
    return Array.from(ySet).sort((a: number, b: number) => b - a); // descending
  }, [yearsFolders]);

  return (
    <>
      <AnimatePresence>
        {solvingPaper && <PaperSolver paper={solvingPaper} onExit={() => setSolvingPaper(null)} />}
      </AnimatePresence>
      <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter">Library</h1>
        <p className="mt-4 text-zinc-400 text-lg uppercase font-bold tracking-tight">Browse Papers By Subject, Year, and Variant.</p>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 overflow-x-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] hide-scrollbar">
        <button 
          onClick={() => { setSelectedSubject(null); setSelectedYear(null); }} 
          className={`flex items-center gap-2 font-black uppercase tracking-widest text-sm transition-colors ${!selectedSubject ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
        >
          <BookOpen className="w-5 h-5" />
          Subjects
        </button>

        {selectedSubject && (
          <>
            <ChevronRight className="w-5 h-5 text-zinc-700 shrink-0" />
            <button 
              onClick={() => setSelectedYear(null)} 
              className={`flex items-center gap-2 font-black uppercase tracking-widest text-sm transition-colors whitespace-nowrap ${selectedSubject && !selectedYear ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
            >
              <Folder className="w-4 h-4" />
              {selectedSubject.name} ({selectedSubject.code})
            </button>
          </>
        )}

        {selectedYear && (
          <>
            <ChevronRight className="w-5 h-5 text-zinc-700 shrink-0" />
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-sm text-cyan-400 whitespace-nowrap">
              <Folder className="w-4 h-4" />
              {selectedYear} Series
            </div>
          </>
        )}
      </div>

      {/* Dynamic Content Area */}
      <AnimatePresence mode="wait">
        
        {loading && (
          <motion.div
             key="loading"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="flex flex-col items-center justify-center p-20 text-cyan-400"
          >
             <Loader2 className="w-12 h-12 animate-spin mb-4" />
             <p className="font-bold uppercase tracking-widest text-sm">Loading Data...</p>
          </motion.div>
        )}
        
        {errorMsg && !loading && (
          <motion.div
             key="error"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="col-span-full p-12 text-center text-red-500 font-bold uppercase tracking-widest"
          >
             <p className="mb-2">Error connecting to Supabase</p>
             <p className="text-sm text-zinc-400 normal-case font-normal">{errorMsg}</p>
             <div className="mt-8 bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-left max-w-md mx-auto shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Troubleshooting</span>
                <ul className="text-xs text-zinc-400 font-medium space-y-2 list-disc list-inside">
                  <li>Ensure your Supabase project URL and Anon key in `.env` are correct.</li>
                  <li>Go to Supabase Dashboard &gt; Storage &gt; Policies &gt; ensure user has SELECT permissions on `storage.objects` table.</li>
                  <li>Click New Policy &gt; "Enable read access for all users" on `storage.objects` for bucket `past-papers`.</li>
                </ul>
             </div>
          </motion.div>
        )}
        
        {/* Step 1: Subjects Grid */}
        {!selectedSubject && !loading && !errorMsg && (
          <motion.div 
            key="subjects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {subjects.length === 0 && (
               <div className="col-span-full p-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                 No subjects found in storage bucket. Add folders like "Geography-2217".
               </div>
            )}
            {subjects.map((sub, i) => (
              <motion.button
                key={sub.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 10) * 0.05 }}
                onClick={() => handleSelectSubject(sub)}
                className="bg-zinc-900/80 border-2 border-zinc-800 rounded-3xl p-6 hover:border-cyan-500 hover:bg-zinc-800 transition-all text-left group relative overflow-hidden h-40 flex flex-col justify-end"
              >
                <div className="absolute -top-6 -right-6 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                  <div className="text-9xl font-black italic">{sub.code}</div>
                </div>
                <div className="absolute top-6 left-6">
                  <Folder className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic leading-tight mb-2 line-clamp-2">{sub.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-black/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                    CODE: {sub.code}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Years Grid */}
        {selectedSubject && !selectedYear && !loading && (
          <motion.div 
            key="years"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4"
          >
             {uniqueYears.length === 0 && (
               <div className="col-span-full p-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                 No years/seasons found for this subject.
               </div>
            )}
            {uniqueYears.map((year, i) => (
              <motion.button
                key={year}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelectYear(year)}
                className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 hover:border-cyan-500 hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-4 group shadow-[0_0_20px_rgba(0,0,0,0.3)]"
              >
                <Folder className="w-10 h-10 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                <span className="text-3xl font-black italic">{year}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Step 3: Variants Grid */}
        {selectedSubject && selectedYear && !loading && (
          <motion.div 
            key="papers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
             {papers.length === 0 && (
               <div className="col-span-full p-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                 No papers found for this year.
               </div>
            )}
            {['Feb/Mar', 'May/Jun', 'Oct/Nov'].map(season => {
              const seasonPapers = papers.filter(p => p.season === season);
              if (seasonPapers.length === 0) return null;

              return (
                <div key={season} className="space-y-6">
                  <h2 className="text-2xl font-black uppercase italic text-zinc-300 flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <Clock className="w-6 h-6 text-cyan-500" />
                    {season} <span className="text-zinc-600">Series</span>
                  </h2>
                  
                  {/* GT and ER Full Form Tiles */}
                  {(seasonPapers[0]?.gtUrl || seasonPapers[0]?.erUrl) && (
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                       {seasonPapers[0].gtUrl && (
                         <a href={seasonPapers[0].gtUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/80 p-5 rounded-3xl flex justify-between items-center group transition-all shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] focus:ring-2 focus:ring-emerald-500 outline-none">
                           <div className="flex flex-col">
                             <span className="text-emerald-400 font-black text-lg tracking-widest uppercase mb-1 drop-shadow-sm">Grade Thresholds</span>
                             <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Official Season Document</span>
                           </div>
                           <FileText className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform drop-shadow-md" />
                         </a>
                       )}
                       {seasonPapers[0].erUrl && (
                         <a href={seasonPapers[0].erUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-zinc-900 border border-purple-500/30 hover:border-purple-500/80 p-5 rounded-3xl flex justify-between items-center group transition-all shadow-[0_0_20px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:ring-2 focus:ring-purple-500 outline-none">
                           <div className="flex flex-col">
                             <span className="text-purple-400 font-black text-lg tracking-widest uppercase mb-1 drop-shadow-sm">Examiner Reports</span>
                             <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Official Season Document</span>
                           </div>
                           <FileText className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform drop-shadow-md" />
                         </a>
                       )}
                    </div>
                  )}

                  {/* Question Papers Section */}
                  <div className="mt-8">
                    <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500 mb-4 flex items-center gap-2">
                       <FileText className="w-4 h-4" />
                       Question Papers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {seasonPapers.map((paper, i) => (
                        <motion.div 
                          key={`qp-${paper.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-cyan-500/50 transition-colors relative overflow-hidden flex flex-col shadow-lg"
                        >
                          <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <div className="text-9xl font-black italic">P{paper.paperCode}</div>
                          </div>
                          
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                              <span className="text-[10px] font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded-md mb-3 inline-block">QUESTION PAPER {paper.paperCode}</span>
                              <h3 className="text-3xl font-black uppercase italic mt-1 line-clamp-1">{paper.subjectName}</h3>
                              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                                PAPER {paper.paperCode} • {paper.season.toUpperCase()} {paper.year}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 mt-auto relative z-10">
                            <button 
                              onClick={() => setSolvingPaper(paper)}
                              className="w-full bg-white text-black hover:bg-cyan-400 font-black uppercase tracking-widest text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-400/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-cyan-500 outline-none"
                            >
                              <Play className="w-4 h-4 fill-black" />
                              SOLVE QP P{paper.paperCode}
                            </button>
                            {paper.pdfUrl && (
                                <a 
                                  href={paper.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View Question Paper"
                                  className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors text-zinc-400 text-[10px] font-bold tracking-widest focus:ring-2 focus:ring-white outline-none"
                                >
                                  VIEW PDF
                                </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mark Schemes Section */}
                  {seasonPapers.some(p => p.markSchemeUrl) && (
                    <div className="mt-4">
                      <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500 mb-4 flex items-center gap-2">
                         <FileText className="w-4 h-4" />
                         Mark Schemes
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                        {seasonPapers.filter(p => p.markSchemeUrl).map((paper, i) => (
                          <motion.div 
                            key={`ms-${paper.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-cyan-500/30 transition-colors relative overflow-hidden flex flex-col shadow-lg"
                          >
                            <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-cyan-500">
                              <div className="text-9xl font-black italic">M{paper.paperCode}</div>
                            </div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                              <div>
                                <span className="text-[10px] font-black tracking-widest uppercase bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 px-2 py-1 rounded-md mb-3 inline-block">MARK SCHEME {paper.paperCode}</span>
                                <h3 className="text-2xl font-black uppercase italic mt-1 line-clamp-1">{paper.subjectName}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                                  PAPER {paper.paperCode} • {paper.season.toUpperCase()} {paper.year}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex mt-auto relative z-10">
                                  <a 
                                    href={paper.markSchemeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View Mark Scheme"
                                    className="w-full py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-cyan-400 rounded-xl transition-colors text-zinc-300 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                                  >
                                    <FileText className="w-4 h-4" />
                                    VIEW MS
                                  </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inserts Section */}
                  {seasonPapers.some(p => p.inUrl) && (
                    <div className="mt-4">
                      <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500 mb-4 flex items-center gap-2">
                         <FileText className="w-4 h-4" />
                         Inserts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                        {seasonPapers.filter(p => p.inUrl).map((paper, i) => (
                          <motion.div 
                            key={`in-${paper.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-amber-500/30 transition-colors relative overflow-hidden flex flex-col shadow-lg"
                          >
                            <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-amber-500">
                              <div className="text-9xl font-black italic">I{paper.paperCode}</div>
                            </div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                              <div>
                                <span className="text-[10px] font-black tracking-widest uppercase bg-amber-900/40 text-amber-400 border border-amber-800/50 px-2 py-1 rounded-md mb-3 inline-block">INSERT {paper.paperCode}</span>
                                <h3 className="text-2xl font-black uppercase italic mt-1 line-clamp-1">{paper.subjectName}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                                  PAPER {paper.paperCode} • {paper.season.toUpperCase()} {paper.year}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex mt-auto relative z-10">
                                  <a 
                                    href={paper.inUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View Insert"
                                    className="w-full py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-amber-400 rounded-xl transition-colors text-zinc-300 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                                  >
                                    <FileText className="w-4 h-4" />
                                    VIEW INSERT
                                  </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
