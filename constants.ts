
import { Section } from './types';

export const DISSERTATION_TOC: Section[] = [
  {
    id: 'intro',
    title: 'INTRODUCERE',
    level: 1,
  },
  {
    id: 'cap1',
    title: 'CAPITOLUL I. ANATOMIA ȘI FIZIOLOGIA COLECISTULUI ȘI CĂILOR BILIARE',
    level: 1,
    subsections: [
      {
        id: '1.1',
        title: 'I.1. NOȚIUNI DE ANATOMIE',
        level: 2,
        subsections: [
          {
            id: '1.1.A',
            title: 'I.1.A. ANATOMIA COLECISTULUI',
            level: 3,
            subsections: [
              { id: '1.1.A.i', title: 'I.1.A.i. STRUCTURA VEZICII BILIARE', level: 4 },
              { id: '1.1.A.ii', title: 'I.1.A.ii. VASCULARIZAȚIA VEZICII BILIARE', level: 4 },
              { id: '1.1.A.iii', title: 'I.1.A.iii. INERVAȚIA VEZICII BILIARE', level: 4 },
            ]
          },
          {
            id: '1.1.B',
            title: 'I.1.B. ANATOMIA CĂILOR BILIARE',
            level: 3,
            subsections: [
              { id: '1.1.B.i', title: 'I.1.B.i. ANATOMIA CĂILOR BILIARE INTRAHEPATICE', level: 4 },
              { id: '1.1.B.ii', title: 'I.1.B.ii. ANATOMIA CĂILOR BILIARE EXTRAHEPATICE', level: 4 },
            ]
          }
        ]
      },
      {
        id: '1.2',
        title: 'I.2. NOȚIUNI DE FIZIOLOGIE',
        level: 2,
        subsections: [
          { id: '1.2.A', title: 'I.2.A. FUNCȚIA COLECISTULUI', level: 3 },
          { id: '1.2.B', title: 'I.2.B. SECREȚIA BILEI', level: 3 },
          { id: '1.2.C', title: 'I.2.C. FUNCȚIILE CĂILOR BILIARE', level: 3 },
        ]
      }
    ]
  },
  {
    id: 'cap2',
    title: 'CAPITOLUL II. COLECISTITA ACUTĂ',
    level: 1,
    subsections: [
      { id: '2.1', title: 'II.1. DEFINIȚIE', level: 2 },
      { id: '2.2', title: 'II.2. CLASIFICARE', level: 2 },
      { id: '2.3', title: 'II.3. EPIDEMIOLOGIE', level: 2 },
      { id: '2.4', title: 'II.4. ETIOLOGIE', level: 2 },
      { id: '2.5', title: 'II.5. PATOGENEZĂ', level: 2 },
      { id: '2.6', title: 'II.6. FIZIOPATOLOGIE', level: 2 },
      { id: '2.7', title: 'II.7. ANATOMIE PATOLOGICĂ', level: 2, subsections: [
          { id: '2.7.A', title: 'II.7.A. MORFOPATOLOGIA COLECISTITEI ACUTE ALITIAZICE', level: 3 },
          { id: '2.7.B', title: 'II.7.B. MORFOPATOLOGIA COLECISTITEI ACUTE LITIAZICE', level: 3 },
      ]},
      { id: '2.8', title: 'II.8. SIMPTOMATOLOGIE', level: 2 },
      { id: '2.9', title: 'II.9. DIAGNOSTIC CLINIC', level: 2 },
      { id: '2.10', title: 'II.10. DIAGNOSTIC IMAGISTIC', level: 2 },
      { id: '2.11', title: 'II.11. DIAGNOSTIC DIFERENȚIAL', level: 2 },
      { id: '2.12', title: 'II.12. GRADUL DE SEVERITATE AL COLECISTITEI', level: 2 },
      { id: '2.13', title: 'II.13. TRATAMENTUL COLECISTITEI ACUTE', level: 2, subsections: [
          { id: '2.13.A', title: 'II.13.A. TRATAMENT MEDICAL', level: 3 },
          { id: '2.13.B', title: 'II.13.B. TRATAMENT CHIRURGICAL', level: 3, subsections: [
              { id: '2.13.B.i', title: 'II.13.B.i. CONDIȚII PREOPERATORICE PENTRU PACIENT', level: 4 },
              { id: '2.13.B.ii', title: 'II.13.B.ii. COLECISTECTOMIA', level: 4 },
          ]},
      ]},
      { id: '2.14', title: 'II.14. POSIBILE COMPLICAȚII ALE COLECISTITEI ACUTE', level: 2 },
      { id: '2.15', title: 'II.15. EVOLUȚIA ȘI PROGNOSTICUL COLECISTITEI ACUTE', level: 2 },
    ]
  },
  {
    id: 'special',
    title: 'PARTEA SPECIALĂ - STUDIU CLINIC ȘI STATISTIC',
    level: 1,
    subsections: [
      { id: '3.1', title: 'III.1. INTRODUCERE ȘI MOTIVAȚIA STUDIULUI', level: 2 },
      { id: '3.2', title: 'III.2. OBIECTIVUL CERCETĂRII', level: 2 },
      { id: '3.3', title: 'III.3. MATERIAL ȘI METODĂ', level: 2 },
      { id: '3.4', title: 'III.4. REZULTATE ȘI DISCUȚII', level: 2, subsections: [
          { id: '3.4.1', title: 'III.4.1. NUMĂRUL TOTAL DE INTERNĂRI ÎN ANUL 2025', level: 3 },
          { id: '3.4.2', title: 'III.4.2. NUMĂRUL TOTAL DE INTERNĂRI CU COLECISTITĂ ACUTĂ ÎN ANUL 2025', level: 3 },
          { id: '3.4.3', title: 'III.4.3. REPARTIȚIA CAZURILOR DE COLECISTITĂ ACUTĂ ÎN FUNCȚIE DE SEX', level: 3 },
          { id: '3.4.4', title: 'III.4.4. REPARTIȚIA CAZURILOR DE COLECISTITĂ ACUTĂ ÎN FUNCȚIE DE VÂRSTĂ', level: 3 },
          { id: '3.4.5', title: 'III.4.5. REPARTIȚIA CAZURILOR DE COLECISTITĂ ACUTĂ ÎN FUNCȚIE DE MEDIUL DE PROVENIENȚĂ', level: 3 },
          { id: '3.4.6', title: 'III.4.6. REPARTIȚIA ÎN FUNCȚIE DE TRATAMENTUL APLICAT: MEDICAMENTOS SAU CHIRURGICAL', level: 3 },
          { id: '3.4.7', title: 'III.4.7. REPARTIȚIA ÎN FUNCȚIE DE ABORDUL CHIRURGICAL UTILIZAT: DESCHIS SAU LAPAROSCOPIC', level: 3 },
          { id: '3.4.8', title: 'III.4.8. REPARTIȚIA ÎN FUNCȚIE DE PATOLOGIILE ASOCIATE', level: 3 },
          { id: '3.4.9', title: 'III.4.9. FORMELE AFECȚIUNILOR BILIARE ÎN FUNCȚIE DE FRECVENȚĂ', level: 3 },
          { id: '3.4.10', title: 'III.4.10. DISTRIBUȚIA PACIENȚILOR ÎN FUNCȚIE DE ETIOLOGIA COLECISTITEI ACUTE LITIAZICE', level: 3 },
          { id: '3.4.11', title: 'III.4.11. DISTRIBUȚIA ÎN FUNCȚIE DE SEMNELE/SIMPTOMELE DOMINANTE DIN COLECISTITA ACUTĂ', level: 3 },
          { id: '3.4.12', title: 'III.4.12. DISTRIBUȚIA PACIENȚILOR ÎN FUNCȚIE DE MODIFICĂRILE ECOGRAFICE PREZENTE', level: 3 },
      ]},
      { id: '3.5', title: 'III.5. CONCLUZII', level: 2 },
    ]
  }
];
