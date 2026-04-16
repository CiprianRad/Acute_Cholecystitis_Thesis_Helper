
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DISSERTATION_TOC } from './constants';
import { Section } from './types';
import { generateSectionContent } from './geminiService';
import { CaseStudyAnalysis } from './src/components/CaseStudyAnalysis';

const App: React.FC = () => {
  const [sections, setSections] = useState<Section[]>(() => {
    const saved = localStorage.getItem('thesis_content_v4');
    return saved ? JSON.parse(saved) : DISSERTATION_TOC;
  });
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [studyStats, setStudyStats] = useState<any>(null);
  const [viewTab, setViewTab] = useState<'analysis' | 'editor'>('analysis');

  // Switch to editor automatically when generation starts or completes
  useEffect(() => {
    if (isGenerating) setViewTab('editor');
  }, [isGenerating]);

  useEffect(() => {
    localStorage.setItem('thesis_content_v4', JSON.stringify(sections));
  }, [sections]);

  const flatSections = useMemo(() => {
    const flattened: Section[] = [];
    const traverse = (list: Section[]) => {
      list.forEach(s => {
        flattened.push(s);
        if (s.subsections) traverse(s.subsections);
      });
    };
    traverse(sections);
    return flattened;
  }, [sections]);

  const activeSection = useMemo(() => 
    flatSections.find(s => s.id === activeSectionId), 
    [flatSections, activeSectionId]
  );

  const updateSectionContent = useCallback((id: string, newContent: string) => {
    const updateRecursive = (list: Section[]): Section[] => {
      return list.map(s => {
        if (s.id === id) return { ...s, content: newContent };
        if (s.subsections) return { ...s, subsections: updateRecursive(s.subsections) };
        return s;
      });
    };
    setSections(prev => updateRecursive(prev));
  }, []);

  const handleGenerate = async () => {
    if (!activeSection) return;
    setIsGenerating(true);
    setError(null);

    try {
      const tocString = flatSections.map(s => `${'  '.repeat(s.level - 1)}${s.title}`).join('\n');
      const currentIndex = flatSections.findIndex(s => s.id === activeSection.id);
      const prevContent = currentIndex > 0 ? flatSections[currentIndex - 1].content || "" : "";
      
      let dataContext = "";
      if (studyStats && (activeSection.id.startsWith('3.') || activeSection.id === 'special')) {
        dataContext = JSON.stringify(studyStats, null, 2);
      }

      const content = await generateSectionContent(activeSection.title, prevContent, tocString, dataContext);
      updateSectionContent(activeSection.id, content);
    } catch (err) {
      setError("Eroare la generare. Asigurați-vă că aveți o conexiune activă.");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculatePageEstimate = (text: string) => {
    if (!text) return 0;
    const wordCount = text.trim().split(/\s+/).length;
    // Standard: TNR 12, 1.5 spacing = ~320 cuvinte per pagină
    return (wordCount / 320).toFixed(2);
  };

  const totalPages = useMemo(() => {
    let totalWords = 0;
    flatSections.forEach(s => {
      if (s.content) totalWords += s.content.trim().split(/\s+/).length;
    });
    return (totalWords / 320).toFixed(1);
  }, [flatSections]);

  const handleExport = () => {
    const fullText = flatSections
      .filter(s => s.content)
      .map(s => `\n\n# ${s.title}\n\n${s.content}`)
      .join('\n');
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Licenta_Colecistita_Acuta_Progres.txt';
    a.click();
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar cu Cuprins */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col shadow-2xl border-r border-slate-700">
        <div className="p-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <i className="fa-solid fa-graduation-cap text-blue-500"></i>
            <h1 className="text-lg font-bold tracking-tight">ThesisMaster</h1>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Medical Assistant</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="bg-slate-800/40 p-4 rounded-xl mb-4 border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Target 50 Pagini</span>
              <span className="text-xs font-bold text-blue-400">{totalPages} p</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                style={{ width: `${Math.min(100, (parseFloat(totalPages) / 50) * 100)}%` }}
              ></div>
            </div>
          </div>

          {sections.map((section) => (
            <TOCItem 
              key={section.id} 
              section={section} 
              activeId={activeSectionId} 
              onSelect={setActiveSectionId} 
            />
          ))}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
           <button onClick={handleExport} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2">
            <i className="fa-solid fa-download"></i> Export Document
           </button>
           <button 
            onClick={() => { if(confirm('Resetezi toată lucrarea?')) { setSections(DISSERTATION_TOC); localStorage.removeItem('thesis_content_v4'); } }}
            className="w-full py-2 text-[10px] text-slate-500 hover:text-red-400 font-medium"
           >
            <i className="fa-solid fa-trash-can mr-1"></i> Resetare progres
           </button>
        </div>
      </aside>

      {/* Editor Content */}
      <main className="flex-1 flex flex-col bg-slate-200/30 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-blue-600 uppercase">{activeSection?.id}</span>
            <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{activeSection?.title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {(activeSectionId === 'special' || activeSectionId.startsWith('3.')) && (
              <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                <button 
                  onClick={() => setViewTab('analysis')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewTab === 'analysis' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-chart-column mr-1"></i> Analiză
                </button>
                <button 
                  onClick={() => setViewTab('editor')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-file-lines mr-1"></i> Text
                </button>
              </div>
            )}
            
            <button 
              onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all shadow-md
              ${isGenerating 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border' 
                : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95'}`}
          >
            {isGenerating ? (
              <><i className="fa-solid fa-dna animate-spin"></i> Se generează capitolul...</>
            ) : (
              <><i className="fa-solid fa-pen-nib"></i> Generează cu Citări</>
            )}
          </button>
        </div>
      </header>

        <section className="flex-1 overflow-y-auto p-10 flex justify-center custom-scrollbar">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[2.5cm] border border-slate-300 academic-font relative">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </div>
            )}

            {!activeSection?.content && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-[500px] text-slate-300 italic border-2 border-dashed border-slate-100 rounded-xl">
                <i className="fa-solid fa-file-medical text-6xl mb-4 opacity-10"></i>
                <p>Selectează o secțiune și apasă butonul de generare.</p>
                <p className="text-[11px] mt-1 uppercase tracking-widest font-bold opacity-50">Sistemul va aplica regulile de citare academică</p>
              </div>
            )}

            {isGenerating && (
              <div className="animate-pulse space-y-6">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-50 rounded"></div>
                  <div className="h-4 bg-slate-50 rounded"></div>
                  <div className="h-4 bg-slate-50 rounded w-5/6"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-50 rounded"></div>
                  <div className="h-4 bg-slate-50 rounded w-2/3"></div>
                </div>
              </div>
            )}

            {(activeSectionId === 'special' || activeSectionId.startsWith('3.')) && viewTab === 'analysis' && !isGenerating && (
              <div className="absolute inset-0 bg-slate-50 overflow-y-auto custom-scrollbar p-6">
                <CaseStudyAnalysis onDataProcessed={setStudyStats} activeSectionId={activeSectionId} />
              </div>
            )}

            {(activeSection?.content || !((activeSectionId === 'special' || activeSectionId.startsWith('3.')) && viewTab === 'analysis')) && (
              <textarea
                className="w-full h-full min-h-[850px] outline-none text-[12pt] leading-[1.5] resize-none whitespace-pre-wrap academic-font text-justify bg-transparent"
                value={activeSection?.content || ""}
                onChange={(e) => updateSectionContent(activeSection!.id, e.target.value)}
                placeholder="Textul generat va fi afișat aici..."
              />
            )}
          </div>
        </section>

        <footer className="h-8 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex gap-6">
            <span>Cuvinte: {activeSection?.content?.trim().split(/\s+/).filter(x => x).length || 0}</span>
            <span>Secțiune: {calculatePageEstimate(activeSection?.content || "")} pagini</span>
          </div>
          <div className="text-blue-500">
            Standard Academic: TNR 12, Interlinie 1.5, Citare [Sursă]
          </div>
        </footer>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .academic-font { font-family: 'Times New Roman', Times, serif; }
      `}</style>
    </div>
  );
};

interface TOCItemProps {
  section: Section;
  activeId: string;
  onSelect: (id: string) => void;
}

const TOCItem: React.FC<TOCItemProps> = ({ section, activeId, onSelect }) => {
  const isActive = activeId === section.id;
  const hasContent = !!section.content;

  const getPadding = (level: number) => {
    switch (level) {
      case 2: return 'pl-8';
      case 3: return 'pl-12';
      case 4: return 'pl-16';
      default: return 'pl-2';
    }
  };

  return (
    <div className="mb-0.5">
      <button
        onClick={() => onSelect(section.id)}
        className={`w-full text-left py-1.5 px-3 rounded transition-all flex items-center gap-2 group
          ${isActive 
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
          ${getPadding(section.level)}`}
      >
        <span className={`w-1 h-1 rounded-full ${hasContent ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-700'}`}></span>
        <span className={`flex-1 line-clamp-1 ${section.level === 1 ? 'text-[11px] font-bold uppercase' : 'text-[10px] font-medium'}`}>
          {section.title}
        </span>
        {hasContent && <i className="fa-solid fa-check text-[8px] text-emerald-500 opacity-70"></i>}
      </button>
      {section.subsections?.map(sub => (
        <TOCItem key={sub.id} section={sub} activeId={activeId} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default App;
