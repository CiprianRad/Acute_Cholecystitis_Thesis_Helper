
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateSectionContent(
  sectionTitle: string, 
  previousContext: string = "",
  fullToc: string = "",
  dataContext: string = ""
) {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Ești un expert în chirurgie generală și statistică medicală, specializat în redactarea lucrărilor de licență medicale. 
    Trebuie să scrii o secțiune extrem de detaliată pentru lucrarea de licență intitulată "COLECISTITA ACUTĂ".

    TITLUL SECȚIUNII CURENTE: "${sectionTitle}"
    
    CONTEXTUL LUCRĂRII (Structura completă):
    ${fullToc}

    ${dataContext ? `DATE STATISTICE DIN STUDIUL PROPRIU (Cazuistică):
    ${dataContext}
    
    CERINȚĂ SPECIALĂ: Interpretează aceste date în contextul capitolului curent. Compară rezultatele obținute cu datele din literatura de specialitate (ex: incidența pe sexe, grupe de vârstă predominante).` : ''}
    
    INFORMAȚII DIN MODELELE DE REFERINȚĂ:
    - Stil: Academic, formal, precis.
    - Surse preferate: Victor Papilian (Anatomia Omului), Harrison (Principii de Medicină Internă), Tokyo Guidelines (TG18/24), Netter (Atlas de Anatomie), Angelescu (Tratat de Patologie Chirurgicală), Irinel Popescu (Tratat de Chirurgie).

    REGULI CRITICE DE REDACTARE:
    1. CITARE OBLIGATORIE: Pentru FIECARE paragraf generat, trebuie să incluzi la final o sursă bibliografică completă între paranteze pătrate: [Autor, Titlu, Ediție, Editură, An, Pagina].
    2. SURSE WEB: Dacă informația provine de pe web, include link-ul URL complet: [Titlu, Organizație, An, URL].
    3. IMAGINI: Dacă sugerezi o imagine sau un atlas, specifică sursa exactă din care ar trebui preluată (ex: Netter, Ed. 7, Pag. 345).
    4. FORMATARE: Folosește diacritice românești. Textul trebuie să fie lung, dens și argumentat științific pentru a contribui la o lucrare de 50 de pagini (interlinie 1.5, TNR 12).
    5. Fără introduceri meta-textuale. Începe direct cu textul capitolului.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.5,
        topP: 0.95,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });

    let text = response.text || "Eroare la generarea conținutului.";
    
    // Extragere link-uri din grounding metadata dacă sunt disponibile
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      const links = groundingMetadata.groundingChunks
        .filter(c => c.web?.uri)
        .map(c => `- ${c.web?.title}: ${c.web?.uri}`)
        .join('\n');
      
      if (links) {
        text += `\n\n---\n**REFERINȚE WEB SUPLIMENTARE IDENTIFICATE:**\n${links}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
