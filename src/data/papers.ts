export type ActivitySeason = 'Feb/Mar' | 'May/Jun' | 'Oct/Nov';

export interface Paper {
  id: string;
  subjectCode: string;
  subjectName: string;
  year: number;
  season: ActivitySeason;
  paperCode: string; // e.g. "21"
  topics: string[];
  pdfUrl: string;
  markSchemeUrl?: string;
  gtUrl?: string; // Grade threshold (season level)
  erUrl?: string; // Examiner report (season level)
  inUrl?: string; // Insert
}

import { supabase } from '../lib/supabase';

export interface SubjectFolder {
  name: string;
  code: string;
  folderName: string;
}

export interface YearSeasonFolder {
  year: number;
  season: string;
  folderName: string;
}

// Fetch available subjects
export async function fetchAvailableSubjects(): Promise<{subjects: SubjectFolder[], error: string | null}> {
  if (!supabase) return { subjects: [], error: 'Supabase client missing' };
  
  try {
    const { data, error } = await supabase.storage.from('past-papers').list();
    if (error) {
      console.error("Storage list error:", error);
      return { subjects: [], error: error.message };
    }
    if (!data) return { subjects: [], error: 'No data returned from storage' };
    
    const subjects = data
      .map(folder => {
        const match = folder.name.match(/^(.*)-(\d{4})$/);
        if (match) {
          return { name: match[1].replace(/-/g, ' '), code: match[2], folderName: folder.name };
        }
        return null;
      })
      .filter(Boolean) as SubjectFolder[];
      
    return { subjects, error: null };
  } catch (err: any) {
    return { subjects: [], error: err.message || 'Unknown error' };
  }
}

export async function fetchAvailableYears(subjectFolderName: string): Promise<YearSeasonFolder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from('past-papers').list(subjectFolderName);
  if (error || !data) return [];
  
  return data.map(folder => {
    const match = folder.name.match(/^(\d{4})\s+(.*)$/);
    if (match) {
      return { year: parseInt(match[1]), season: match[2], folderName: folder.name };
    }
    return null;
  }).filter(Boolean) as YearSeasonFolder[];
}

export async function fetchAvailablePapers(subjectFolderName: string, yearSeasonFolderName: string, subjectCode: string, subjectName: string): Promise<{papers: Paper[], rawList: string[]}> {
  if (!supabase) return {papers: [], rawList: []};
  const path = `${subjectFolderName}/${yearSeasonFolderName}`;
  const { data, error } = await supabase.storage.from('past-papers').list(path, { limit: 1000 });
  if (error || !data) return {papers: [], rawList: []};
  
  const rawList = data.map(d => d.name);
  console.log(`Files in ${path}:`, rawList);
  
  const qpFiles = data.filter(file => file.name.includes('_qp_') && file.name.endsWith('.pdf'));
  
  const gtFile = data.find(file => file.name.toLowerCase().includes('_gt') && file.name.endsWith('.pdf'));
  const gtUrl = gtFile ? supabase.storage.from('past-papers').getPublicUrl(`${path}/${gtFile.name}`).data.publicUrl : undefined;

  const erFile = data.find(file => file.name.toLowerCase().includes('_er') && file.name.endsWith('.pdf'));
  const erUrl = erFile ? supabase.storage.from('past-papers').getPublicUrl(`${path}/${erFile.name}`).data.publicUrl : undefined;

  const papers: Paper[] = [];
  
  const ysMatch = yearSeasonFolderName.match(/^(\d{4})\s+(.*)$/);
  const year = ysMatch ? parseInt(ysMatch[1]) : 0;
  const seasonStr = ysMatch ? ysMatch[2] : '';
  let season: ActivitySeason = 'May/Jun';
  if (seasonStr.includes('Oct') || seasonStr.includes('Nov')) season = 'Oct/Nov';
  if (seasonStr.includes('Feb') || seasonStr.includes('Mar')) season = 'Feb/Mar';
  if (seasonStr.includes('May') || seasonStr.includes('Jun')) season = 'May/Jun';

  for (const qpFile of qpFiles) {
    const paperMatch = qpFile.name.match(/_qp_(\d+)/i);
    const paperCode = paperMatch ? paperMatch[1] : 'Unknown';
    
    const baseMatch = qpFile.name.match(/^(.*_)(qp)(_\d+\.pdf)$/i);
    let msFileName = qpFile.name.replace('_qp_', '_ms_');
    if (baseMatch) {
       msFileName = `${baseMatch[1]}ms${baseMatch[3]}`;
    }
    
    // Check multiple ways to find the MS
    const msFile = data.find(file => 
      file.name.toLowerCase() === msFileName.toLowerCase() ||
      (file.name.toLowerCase().includes('_ms_') && file.name.includes(paperCode))
    );
    
    const inFile = data.find(file => file.name.toLowerCase().includes('_in_') && file.name.includes(paperCode));

    papers.push({
      id: `${subjectCode}-${year}-${seasonStr}-${paperCode}`,
      subjectCode,
      subjectName,
      year,
      season,
      paperCode,
      topics: ['Fetched from Storage'],
      pdfUrl: supabase.storage.from('past-papers').getPublicUrl(`${path}/${qpFile.name}`).data.publicUrl,
      markSchemeUrl: msFile ? supabase.storage.from('past-papers').getPublicUrl(`${path}/${msFile.name}`).data.publicUrl : undefined,
      gtUrl,
      erUrl,
      inUrl: inFile ? supabase.storage.from('past-papers').getPublicUrl(`${path}/${inFile.name}`).data.publicUrl : undefined,
    });
  }
  
  // Sort descending by paper code
  return {
    papers: papers.sort((a, b) => a.paperCode.localeCompare(b.paperCode)),
    rawList
  };
}

// Keep the old types for reference if needed
export const MAIN_SUBJECTS = [
  { code: '4024', name: 'Mathematics D', type: 'core' },
  { code: '4037', name: 'Mathematics Additional', type: 'core' },
  { code: '5090', name: 'Biology', type: 'science' },
  { code: '5070', name: 'Chemistry', type: 'science' },
  { code: '2217', name: 'Geography', type: 'humanity' },
  { code: '2210', name: 'Computer Science', type: 'tech' },
  { code: '7115', name: 'Business Studies', type: 'humanity' },
  { code: '2281', name: 'Economics', type: 'humanity' },
  { code: '7707', name: 'Accounting', type: 'humanity' },
  { code: '1123', name: 'English Language', type: 'language' },
  { code: '2147', name: 'History', type: 'humanity' },
  { code: '2058', name: 'Islamiyat', type: 'humanity' },
  { code: '2068', name: 'Islamic Studies', type: 'humanity' },
  { code: '2010', name: 'Literature in English', type: 'language' },
  { code: '3015', name: 'French', type: 'language' },
  { code: '5014', name: 'Environmental Management', type: 'science' },
  { code: '6065', name: 'Food and Nutrition', type: 'science' },
] as const;

const SUBJECT_TOPICS: Record<string, string[]> = {
  '0580': ['Numbers', 'Algebra', 'Mensuration', 'Geometry', 'Trigonometry', 'Vectors', 'Probability', 'Statistics'],
  '0625': ['Motion', 'Forces', 'Energy', 'Thermal Physics', 'Waves', 'Light', 'Electricity', 'Magnetism', 'Nuclear Physics'],
  '0620': ['States of Matter', 'Atoms', 'Stoichiometry', 'Electrochemistry', 'Chemical Energetics', 'Acids & Bases', 'Periodic Table', 'Metals', 'Organic Chemistry'],
  '0478': ['Data Representation', 'Communication', 'Hardware', 'Software', 'Security', 'Algorithms', 'Programming', 'Databases', 'Boolean Logic'],
  '0455': ['Microeconomics', 'Macroeconomics', 'Market Failure', 'Government Policy', 'International Trade', 'Exchange Rates'],
};

const DEFAULT_TOPICS = ['Core Concepts', 'Theory', 'Practical', 'Problem Solving'];

const YEARS = Array.from({ length: 11 }, (_, i) => 2024 - i); // 2014-2024
const SEASONS: ActivitySeason[] = ['Feb/Mar', 'May/Jun', 'Oct/Nov'];

// Simulates generating 10,000+ papers instantly in memory to populate the database
export function generatePapersDatabase(): Paper[] {
  const db: Paper[] = [];
  let idCounter = 1;

  for (const subject of MAIN_SUBJECTS) {
    const topics = SUBJECT_TOPICS[subject.code] || DEFAULT_TOPICS;
    const isScience = subject.type === 'science';
    const isMath = subject.code === '4024' || subject.code === '4037';
    
    // Different subjects have different paper combinations
    let standardPapers = ['11', '12', '21', '22']; // generic
    if (isScience) standardPapers = ['21', '22', '41', '42', '61', '62']; // MCQ, Extended, Alt to Practical
    if (isMath) standardPapers = ['21', '22', '23', '41', '42', '43'];

    for (const year of YEARS) {
      for (const season of SEASONS) {
        // Feb/Mar usually has variant 2 instead of 1, 2, 3
        const seasonPapers = season === 'Feb/Mar' 
          ? standardPapers.filter(p => p.endsWith('2'))
          : standardPapers;

        for (const paperCode of seasonPapers) {
          // Assign 2-3 random topics for the tags
          const paperTopics = [...topics]
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 2) + 2);
            
          const seasonCode = season === 'Feb/Mar' ? 'm' : season === 'May/Jun' ? 's' : 'w';
          const shortYear = year.toString().slice(-2);
          const filePrefix = `${subject.code}_${seasonCode}${shortYear}`;
          
          // Constructing URLs for common public past paper archives (e.g. GCE Guide format)
          const urlSubjectName = encodeURIComponent(`${subject.name} (${subject.code})`);
          const pdfUrl = `https://papers.gceguide.com/Cambridge%20IGCSE/${urlSubjectName}/${year}/${filePrefix}_qp_${paperCode}.pdf`;
          const markSchemeUrl = `https://papers.gceguide.com/Cambridge%20IGCSE/${urlSubjectName}/${year}/${filePrefix}_ms_${paperCode}.pdf`;

          db.push({
            id: `P-${year}-${subject.code}-${season.replace('/', '')}-${paperCode}-${idCounter++}`,
            subjectCode: subject.code,
            subjectName: subject.name,
            year,
            season,
            paperCode,
            topics: paperTopics,
            pdfUrl,
            markSchemeUrl,
          });
        }
      }
    }
  }

  // Sort descending by year
  return db.sort((a, b) => b.year - a.year);
}

// Lazy loaded singleton database
let _dbInstance: Paper[] | null = null;
export function getPapersDB(): Paper[] {
  if (!_dbInstance) {
    _dbInstance = generatePapersDatabase();
  }
  return _dbInstance;
}
