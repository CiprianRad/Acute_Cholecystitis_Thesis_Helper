
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FileUp, Database, PieChart as PieChartIcon, BarChart3, Users, MapPin, Activity, TrendingUp } from 'lucide-react';
import { HISTORICAL_DATA } from '../constants/historicalData';

interface PatientData {
  NrCrt: string;
  NumePacient: string;
  Sectie: string;
  DiagnosticTrimitere: string;
  DiagnosticInternare: string;
  DiagnosticExternare: string;
  InternatDe: string;
  CNP: string;
  Judet: string;
  Localitate: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface CaseStudyAnalysisProps {
  onDataProcessed?: (stats: any) => void;
  activeSectionId?: string;
}

export const CaseStudyAnalysis: React.FC<CaseStudyAnalysisProps> = ({ onDataProcessed, activeSectionId }) => {
  const [data, setData] = useState<PatientData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSection, setIsGeneratingSection] = useState(false);
  const [generatedSections, setGeneratedSections] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'charts' | 'table' | '3d' | 'tabular-model' | 'comparative'>('charts');

  const handleGenerateStatistics = () => {
    if (!activeSectionId) return;
    setIsGeneratingSection(true);
    // Simulate complex statistical calculation
    setTimeout(() => {
      setGeneratedSections(prev => new Set(prev).add(activeSectionId));
      setIsGeneratingSection(false);
    }, 800);
  };

  // Reset generation state if data changes (new file uploaded)
  useEffect(() => {
    setGeneratedSections(new Set());
  }, [data]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        setIsProcessing(false);
        return;
      }

      try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          alert("Fișierul Excel este gol.");
          setIsProcessing(false);
          return;
        }

        // Find header row
        let headerIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i].map(cell => String(cell).toUpperCase());
          if (row.some(cell => cell.includes('NRCRT')) && row.some(cell => cell.includes('CNP'))) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          alert("Nu am putut identifica capul de tabel. Asigurați-vă că fișierul conține coloanele 'NrCrt' și 'CNP'.");
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[headerIndex].map(h => String(h).trim());
        const rows = jsonData.slice(headerIndex + 1);

        const parsedData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        }).filter(row => {
          const cnpKey = Object.keys(row).find(k => k.toUpperCase() === 'CNP');
          const cnpValue = cnpKey ? String(row[cnpKey]).trim() : '';
          return cnpValue && cnpValue.length >= 13;
        }).map(row => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const upperKey = key.toUpperCase();
            if (upperKey === 'CNP') normalizedRow.CNP = String(row[key]).trim();
            else if (upperKey === 'LOCALITATE') normalizedRow.Localitate = row[key];
            else if (upperKey === 'SECTIE') normalizedRow.Sectie = row[key];
            else if (upperKey.includes('DIAGNOSTIC') && upperKey.includes('EXTERNARE')) normalizedRow.DiagnosticExternare = row[key];
            else if (upperKey.includes('DIAGNOSTIC') && upperKey.includes('INTERNARE')) normalizedRow.DiagnosticInternare = row[key];
            else if (upperKey.includes('DIAGNOSTIC') && upperKey.includes('TRIMITERE')) normalizedRow.DiagnosticTrimitere = row[key];
            else normalizedRow[key] = row[key];
          });
          return normalizedRow as PatientData;
        });

        if (parsedData.length === 0) {
          alert("Nu s-au găsit date valide (CNP lipsă sau incorect).");
        } else {
          setData(parsedData);
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        alert("Eroare la procesarea fișierului Excel.");
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert("Eroare la citirea fișierului.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const genderCount = { M: 0, F: 0 };
    const acuteGenderCount = { M: 0, F: 0 };
    const ageGroups: Record<string, number> = {
      '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '66-80': 0, '80+': 0
    };
    const acuteAgeGroups: Record<string, number> = {
      '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '66-80': 0, '80+': 0
    };
    const provenance: Record<string, number> = { 'URBAN': 0, 'RURAL': 0 };
    const acuteProvenance: Record<string, number> = { 'URBAN': 0, 'RURAL': 0 };
    const cholecystitisStats = { total: 0, acute: 0, chronic: 0, lithiasic: 0, alithiasic: 0 };
    const treatmentStats = { medical: 0, surgical: 0 };
    const surgicalApproach = { laparoscopic: 0, open: 0 };
    const associatedPathologies: Record<string, number> = {};
    const symptoms: Record<string, number> = {};
    const ultrasoundFindings: Record<string, number> = {};
    const etiologyData: Record<string, number> = {};

    data.forEach(p => {
      const diagTrimitere = (p.DiagnosticTrimitere || '').toUpperCase();
      const diag = (p.DiagnosticExternare + ' ' + p.DiagnosticInternare + ' ' + p.DiagnosticTrimitere).toUpperCase();
      
      // Specific rules for Acute Cholecystitis based on user clinical criteria:
      // 1. "Colecistită" in referral = Acute
      // 2. "Colecistită Litiazică" in referral = Acute
      // 3. Explicit "Acută" in any diagnosis = Acute
      // 4. Exclude "Colecistopatie" unless "Acută" is also present
      const hasAcuteKeyword = diag.includes('ACUT');
      const isAcuteByTrimitere = 
        (diagTrimitere.includes('COLECISTITA') && !diagTrimitere.includes('COLECISTOPATIE')) ||
        diagTrimitere.includes('COLECISTITA LITIAZICA');
      
      const isAcute = hasAcuteKeyword || isAcuteByTrimitere;
      const isCholecystitis = diag.includes('COLECIST') || diag.includes('K80') || diag.includes('K81');

      const firstDigit = parseInt(p.CNP[0]);
      const isMale = [1, 3, 5, 7].includes(firstDigit);
      const isFemale = [2, 4, 6, 8].includes(firstDigit);

      if (isMale) genderCount.M++;
      else if (isFemale) genderCount.F++;

      let year = parseInt(p.CNP.substring(1, 3));
      if ([1, 2].includes(firstDigit)) year += 1900;
      else if ([3, 4].includes(firstDigit)) year += 1800;
      else if ([5, 6].includes(firstDigit)) year += 2000;
      const age = new Date().getFullYear() - year;
      
      const getAgeGroup = (a: number) => {
        if (a <= 18) return '0-18';
        if (a <= 35) return '19-35';
        if (a <= 50) return '36-50';
        if (a <= 65) return '51-65';
        if (a <= 80) return '66-80';
        return '80+';
      };
      const ageGroup = getAgeGroup(age);
      ageGroups[ageGroup]++;

      const urbanCities = ['ORADEA', 'SALONTA', 'MARGHITA', 'BEIUS', 'STEI', 'ALESD', 'NUCET', 'VAREI'];
      const loc = p.Localitate?.trim().toUpperCase() || '';
      const isUrban = urbanCities.includes(loc);
      if (isUrban) provenance['URBAN']++;
      else provenance['RURAL']++;

      if (isCholecystitis && isAcute) {
        if (isMale) acuteGenderCount.M++;
        else if (isFemale) acuteGenderCount.F++;
        acuteAgeGroups[ageGroup]++;
        if (isUrban) acuteProvenance['URBAN']++;
        else acuteProvenance['RURAL']++;
      }

      if (isCholecystitis) {
        cholecystitisStats.total++;
        if (isAcute) cholecystitisStats.acute++;
        if (diag.includes('CRONIC')) cholecystitisStats.chronic++;
        if (diag.includes('LITIAZ')) cholecystitisStats.lithiasic++;
        else cholecystitisStats.alithiasic++;

        if (diag.includes('CALCUL')) etiologyData['Calculi Biliari'] = (etiologyData['Calculi Biliari'] || 0) + 1;
        else if (diag.includes('SLUDGE') || diag.includes('MAL')) etiologyData['Sludge Biliar'] = (etiologyData['Sludge Biliar'] || 0) + 1;
        else etiologyData['Alte Cauze'] = (etiologyData['Alte Cauze'] || 0) + 1;

        if (p.Sectie.includes('CHIRURGIE') || diag.includes('OP.')) {
          treatmentStats.surgical++;
          if (diag.includes('LAPAROSCOPIC') || diag.includes('LSK')) surgicalApproach.laparoscopic++;
          else surgicalApproach.open++;
        } else {
          treatmentStats.medical++;
        }

        if (diag.includes('HTA')) associatedPathologies['HTA'] = (associatedPathologies['HTA'] || 0) + 1;
        if (diag.includes('DZ')) associatedPathologies['Diabet Zaharat'] = (associatedPathologies['Diabet Zaharat'] || 0) + 1;
        if (diag.includes('CIC')) associatedPathologies['Cardiopatie Ischemică'] = (associatedPathologies['Cardiopatie Ischemică'] || 0) + 1;
        if (diag.includes('OBEZITATE')) associatedPathologies['Obezitate'] = (associatedPathologies['Obezitate'] || 0) + 1;

        if (diag.includes('DURERE')) symptoms['Durere'] = (symptoms['Durere'] || 0) + 1;
        if (diag.includes('FEBRA')) symptoms['Febră'] = (symptoms['Febră'] || 0) + 1;
        if (diag.includes('ICTER')) symptoms['Icter'] = (symptoms['Icter'] || 0) + 1;
        if (diag.includes('GREATA') || diag.includes('VARSAT')) symptoms['Greață/Vărsături'] = (symptoms['Greață/Vărsături'] || 0) + 1;

        if (diag.includes('PERETE')) ultrasoundFindings['Perete îngroșat'] = (ultrasoundFindings['Perete îngroșat'] || 0) + 1;
        if (diag.includes('CALCUL')) ultrasoundFindings['Calculi'] = (ultrasoundFindings['Calculi'] || 0) + 1;
        if (diag.includes('COLECIST') && diag.includes('MARE')) ultrasoundFindings['Colecist destins'] = (ultrasoundFindings['Colecist destins'] || 0) + 1;
      }
    });

    const result = {
      genderData: [{ name: 'Masculin', value: genderCount.M }, { name: 'Feminin', value: genderCount.F }],
      ageData: Object.entries(ageGroups).map(([name, value]) => ({ name, value })),
      provenanceData: Object.entries(provenance).map(([name, value]) => ({ name, value })),
      acuteGenderData: [{ name: 'Masculin', value: acuteGenderCount.M }, { name: 'Feminin', value: acuteGenderCount.F }],
      acuteAgeData: Object.entries(acuteAgeGroups).map(([name, value]) => ({ name, value })),
      acuteProvenanceData: Object.entries(acuteProvenance).map(([name, value]) => ({ name, value })),
      treatmentData: [{ name: 'Medicamentos', value: treatmentStats.medical }, { name: 'Chirurgical', value: treatmentStats.surgical }],
      approachData: [{ name: 'Laparoscopic', value: surgicalApproach.laparoscopic }, { name: 'Clasic', value: surgicalApproach.open }],
      pathologyData: Object.entries(associatedPathologies).map(([name, value]) => ({ name, value })),
      symptomData: Object.entries(symptoms).map(([name, value]) => ({ name, value })),
      ultrasoundData: Object.entries(ultrasoundFindings).map(([name, value]) => ({ name, value })),
      etiologyData: Object.entries(etiologyData).map(([name, value]) => ({ name, value })),
      frequencyData: [
        { name: 'C. Acută Litiazică', value: cholecystitisStats.lithiasic },
        { name: 'C. Acută Alitiazică', value: cholecystitisStats.alithiasic },
        { name: 'C. Cronică', value: cholecystitisStats.chronic }
      ],
      cholecystitisStats,
      totalAdmissions: data.length
    };

    return result;
  }, [data]);

  useEffect(() => {
    if (stats && onDataProcessed) {
      onDataProcessed(stats);
    }
  }, [stats, onDataProcessed]);

  const renderSectionSpecificContent = () => {
    if (!stats) return null;

    let currentData: any[] = [];
    let title = "";
    let chartType: 'pie' | 'bar' = 'pie';

    switch (activeSectionId) {
      case '3.4.1': title = "Total Internări 2025"; currentData = [{ name: 'Total Internări', value: stats.totalAdmissions }]; chartType = 'bar'; break;
      case '3.4.2': title = "Cazuri Colecistită Acută"; currentData = [{ name: 'Colecistită Acută', value: stats.cholecystitisStats.acute }, { name: 'Alte Internări', value: stats.totalAdmissions - stats.cholecystitisStats.acute }]; break;
      case '3.4.3': title = "Repartiția pe Sex (Colecistită Acută)"; currentData = stats.acuteGenderData; break;
      case '3.4.4': title = "Repartiția pe Vârstă (Colecistită Acută)"; currentData = stats.acuteAgeData; chartType = 'bar'; break;
      case '3.4.5': title = "Mediul de Proveniență (Colecistită Acută)"; currentData = stats.acuteProvenanceData; break;
      case '3.4.6': title = "Tip Tratament"; currentData = stats.treatmentData; break;
      case '3.4.7': title = "Abord Chirurgical"; currentData = stats.approachData; break;
      case '3.4.8': title = "Patologii Asociate"; currentData = stats.pathologyData; chartType = 'bar'; break;
      case '3.4.9': title = "Frecvența Afecțiunilor Biliare"; currentData = stats.frequencyData; break;
      case '3.4.10': title = "Etiologia C.A. Litiazice"; currentData = stats.etiologyData; break;
      case '3.4.11': title = "Simptomatologie"; currentData = stats.symptomData; chartType = 'bar'; break;
      case '3.4.12': title = "Modificări Ecografice"; currentData = stats.ultrasoundData; chartType = 'bar'; break;
      default:
        title = "Analiză Generală (Indicatori Cheie)";
        currentData = [
          ...stats.genderData.map(d => ({ ...d, name: `Sex: ${d.name}` })),
          ...stats.provenanceData.map(d => ({ ...d, name: `Mediu: ${d.name}` })),
          { name: 'Tratament Chirurgical', value: stats.treatmentData[1].value },
          { name: 'Tratament Medicamentos', value: stats.treatmentData[0].value },
        ];
        break;
    }

    if (viewMode === 'charts' && (!activeSectionId || !activeSectionId.startsWith('3.4.'))) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title="Distribuția pe Genuri (N=Lot Studiat)">
              <PieChart>
                <Pie 
                  data={stats.genderData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={100} 
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {stats.genderData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} pacienți`, 'Volum']} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ChartContainer>
            <ChartContainer title="Mediul de Proveniență (Analiză Demografică)">
              <PieChart>
                <Pie 
                  data={stats.provenanceData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={100} 
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(value) => [`${value} pacienți`, 'Volum']} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ChartContainer>
            <ChartContainer title="Distribuția pe Grupe de Vârstă (Frecvență Absolută)" className="lg:col-span-2">
              <BarChart data={stats.ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} label={{ value: 'Nr. Pacienți', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#94a3b8' } }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => [`${value} cazuri`, 'Frecvență']} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#1e293b' }} />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Sinteză Tehnică Lot Studiat
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Eșantion Total (N)</p>
                <p className="text-2xl font-black text-white">{stats.totalAdmissions}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Prevalență C.A.</p>
                <p className="text-2xl font-black text-white">{((stats.cholecystitisStats.acute / stats.totalAdmissions) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Raport M:F</p>
                <p className="text-2xl font-black text-white">{(stats.genderData[0].value / (stats.genderData[1].value || 1)).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Indice Chirurgical</p>
                <p className="text-2xl font-black text-white">{((stats.treatmentData[1].value / stats.cholecystitisStats.total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'comparative') {
      const yearlyTrend = [
        ...HISTORICAL_DATA.yearlyStats,
        // Add current data as a "Current Lot" entry if it's not already there
        { year: 'Lot Curent', totalAdmissions: stats.totalAdmissions, acuteCases: stats.cholecystitisStats.acute }
      ];

      return (
        <div className="space-y-8">
          <ChartContainer title="Evoluția Internărilor Totale (2019 - Prezent)">
            <BarChart data={yearlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f1f5f9'}} />
              <Legend />
              <Bar name="Total Internări" dataKey="totalAdmissions" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar name="Colecistită Acută" dataKey="acuteCases" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title="Comparativ Sex (Lot Curent vs. Istoric 2019-2022)">
              <BarChart 
                layout="vertical"
                data={[
                  { name: 'Feminin', curent: stats.genderData.find(d => d.name === 'Feminin')?.value || 0, istoric: HISTORICAL_DATA.demographics2019_2022.gender.F },
                  { name: 'Masculin', curent: stats.genderData.find(d => d.name === 'Masculin')?.value || 0, istoric: HISTORICAL_DATA.demographics2019_2022.gender.M }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar name="Lot Curent" dataKey="curent" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar name="Istoric (2019-2022)" dataKey="istoric" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>

            <ChartContainer title="Comparativ Mediu (Lot Curent vs. Istoric 2019-2022)">
              <BarChart 
                layout="vertical"
                data={[
                  { name: 'Urban', curent: stats.provenanceData.find(d => d.name === 'URBAN')?.value || 0, istoric: HISTORICAL_DATA.demographics2019_2022.provenance.URBAN },
                  { name: 'Rural', curent: stats.provenanceData.find(d => d.name === 'RURAL')?.value || 0, istoric: HISTORICAL_DATA.demographics2019_2022.provenance.RURAL }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar name="Lot Curent" dataKey="curent" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar name="Istoric (2019-2022)" dataKey="istoric" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
            <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" /> Notă privind Datele Comparative
            </h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              Datele istorice (2019-2023) au fost extrase din lucrările de licență și disertație anterioare (Univ. Oradea). 
              Acestea servesc drept punct de referință pentru validarea tendințelor observate în lotul curent de studiu, 
              evidențiind variațiile sezoniere și impactul perioadei pandemice asupra adresabilității chirurgicale.
            </p>
          </div>
        </div>
      );
    }

    if (viewMode === 'table') {
      return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr><th className="px-6 py-4">Indicator</th><th className="px-6 py-4 text-right">Valoare Absolută (Nr.)</th><th className="px-6 py-4 text-right">Procent (%)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((item, i) => {
                const total = currentData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(2) : "0.00";
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-right font-mono">{item.value}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (viewMode === '3d') {
      return (
        <div className="flex items-end justify-around h-[400px] bg-slate-50 rounded-2xl p-10 border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          {currentData.map((item, i) => {
            const max = Math.max(...currentData.map(d => d.value), 1);
            const height = (item.value / max) * 300;
            return (
              <div key={i} className="flex flex-col items-center group relative" style={{ perspective: '1000px' }}>
                <div className="mb-4 text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors">{item.value}</div>
                <div className="w-16 relative transition-all duration-700 ease-out group-hover:scale-110" style={{ height: `${Math.max(height, 5)}px`, transformStyle: 'preserve-3d', transform: 'rotateX(-15deg) rotateY(15deg)' }}>
                  <div className="absolute inset-0 bg-blue-500 border border-blue-400 shadow-lg" style={{ transform: 'translateZ(15px)' }}></div>
                  <div className="absolute inset-0 bg-blue-700" style={{ transform: 'translateZ(-15px)' }}></div>
                  <div className="absolute inset-y-0 w-[30px] bg-blue-600" style={{ transform: 'rotateY(-90deg) translateZ(15px)' }}></div>
                  <div className="absolute inset-y-0 w-[30px] bg-blue-400" style={{ transform: 'rotateY(90deg) translateZ(15px)' }}></div>
                  <div className="absolute inset-x-0 h-[30px] bg-blue-300" style={{ transform: 'rotateX(90deg) translateZ(15px)' }}></div>
                </div>
                <div className="mt-6 text-[10px] font-bold uppercase tracking-tighter text-slate-500 max-w-[80px] text-center leading-tight">{item.name}</div>
              </div>
            );
          })}
        </div>
      );
    }

    if (viewMode === 'tabular-model') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentData.map((item, i) => {
            const total = currentData.reduce((acc, curr) => acc + curr.value, 0);
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Database className="w-4 h-4" /></div>
                  <span className="text-2xl font-black text-slate-800">{percent}%</span>
                </div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.name}</h5>
                <p className="text-lg font-bold text-slate-900">{item.value} pacienți</p>
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div></div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ChartContainer title={title}>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie 
                data={currentData} 
                cx="50%" cy="50%" 
                innerRadius={60} outerRadius={100} 
                paddingAngle={5} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {currentData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value} pacienți`, 'Volum']} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          ) : (
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => [`${value} cazuri`, 'Frecvență']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#1e293b' }} />
            </BarChart>
          )}
        </ChartContainer>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Observații Tehnice</h5>
          <p className="text-xs text-blue-800 leading-relaxed italic">
            Datele reflectă o distribuție {currentData.length > 2 ? 'multimodală' : 'bimodală'} cu o valoare maximă de {Math.max(...currentData.map(d => d.value))} unități pentru indicatorul "{currentData.find(d => d.value === Math.max(...currentData.map(d => d.value)))?.name}".
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Database className="w-6 h-6 text-blue-600" />Analiză Cazuistică: {activeSectionId || "General"}</h3>
            <p className="text-slate-500 text-sm mt-1">Vizualizări avansate pentru datele extrase din Excel.</p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all">
            <FileUp className="w-4 h-4" />Actualizează Excel
            <input type="file" accept=".xls,.xlsx" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {data.length > 0 && stats && (
          <div className="flex flex-col gap-6">
            {(!activeSectionId || generatedSections.has(activeSectionId)) ? (
              <>
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit self-center shadow-inner">
                  {[
                    { id: 'charts', icon: <PieChartIcon className="w-4 h-4" />, label: 'Grafice' },
                    { id: 'table', icon: <Database className="w-4 h-4" />, label: 'Tabele' },
                    { id: 'comparative', icon: <TrendingUp className="w-4 h-4" />, label: 'Comparativ' },
                    { id: '3d', icon: <BarChart3 className="w-4 h-4" />, label: 'Modele 3D' },
                    { id: 'tabular-model', icon: <Activity className="w-4 h-4" />, label: 'Model Tabelar' }
                  ].map(mode => (
                    <button key={mode.id} onClick={() => setViewMode(mode.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${viewMode === mode.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {mode.icon}{mode.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-[400px]">{renderSectionSpecificContent()}</div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-4 animate-bounce">
                  <Activity className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Statistici pregătite pentru Secțiunea {activeSectionId}</h4>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-md">Datele au fost procesate din fișierul Excel. Apăsați butonul de mai jos pentru a genera reprezentările vizuale specifice acestei secțiuni.</p>
                <button 
                  onClick={handleGenerateStatistics}
                  disabled={isGeneratingSection}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGeneratingSection ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Se generează analizele...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      Generează Statistici {activeSectionId}
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
              <StatCard icon={<Users />} label="Total Internări" value={data.length} color="blue" />
              <StatCard icon={<Activity />} label="Colecistită Acută" value={stats.cholecystitisStats.acute} color="red" />
              <StatCard icon={<MapPin />} label="Proveniență Urban" value={stats.provenanceData[0].value} color="emerald" />
              <StatCard icon={<Database />} label="Trat. Chirurgical" value={stats.treatmentData[1].value} color="amber" />
            </div>
          </div>
        )}

        {isProcessing && <div className="flex flex-col items-center justify-center py-20 animate-pulse"><Database className="w-12 h-12 text-blue-200 mb-4" /><p className="text-slate-400 font-medium">Se procesează datele...</p></div>}
        {!isProcessing && data.length === 0 && <div className="border-2 border-dashed border-slate-100 rounded-2xl py-20 flex flex-col items-center justify-center text-slate-300"><FileUp className="w-16 h-16 mb-4 opacity-20" /><p className="italic">Încarcă fișierul Excel pentru a activa vizualizările.</p></div>}
      </div>
    </div>
  );
};

const ChartContainer = ({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) => (
  <div className={`bg-slate-50 p-6 rounded-xl border border-slate-100 ${className}`}>
    <h4 className="text-xs font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-wider"><PieChartIcon className="w-3 h-3" />{title}</h4>
    <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer></div>
  </div>
);

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
      <div className="p-3 bg-white rounded-xl shadow-sm">{React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}</div>
      <div><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p><p className="text-2xl font-black">{value}</p></div>
    </div>
  );
};
