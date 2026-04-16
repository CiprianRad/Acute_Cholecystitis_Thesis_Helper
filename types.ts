
export interface Section {
  id: string;
  title: string;
  level: number;
  subsections?: Section[];
  content?: string;
  pageEstimate?: number;
}

export interface DissertationState {
  sections: Section[];
  currentSectionId: string;
  targetPages: number;
}

export interface GenerationRequest {
  sectionId: string;
  sectionTitle: string;
  context?: string;
}
