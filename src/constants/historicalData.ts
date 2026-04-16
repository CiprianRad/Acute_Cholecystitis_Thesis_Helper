
export const HISTORICAL_DATA = {
  yearlyStats: [
    { year: '2019', totalAdmissions: 3212, acuteCases: 51 },
    { year: '2020', totalAdmissions: 1786, acuteCases: 33 },
    { year: '2021', totalAdmissions: 1541, acuteCases: 29 },
    { year: '2022', totalAdmissions: 2095, acuteCases: 50 },
    { year: '2023', totalAdmissions: 3264, acuteCases: 60 },
  ],
  demographics2019_2022: {
    gender: { F: 102, M: 61 },
    provenance: { URBAN: 97, RURAL: 66 },
    ageGroups: {
      '20-30': 4,
      '31-40': 26,
      '41-50': 20,
      '51-60': 45,
      '61-70': 33,
      '71-80': 26,
      '80+': 9
    },
    treatment: { medical: 32, surgical: 68 }, // percentages
    surgicalApproach: { laparoscopic: 89, open: 11 } // percentages
  },
  demographics2022_2023: {
    gender: { F: 66, M: 44 },
    provenance: { URBAN: 77, RURAL: 33 },
    ageGroups: {
      '11-20': 1,
      '21-30': 11,
      '31-40': 15,
      '41-50': 20,
      '51-60': 27,
      '61-70': 25,
      '71-80': 9,
      '81-90': 2
    },
    treatment: { medical: 35, surgical: 65 }, // percentages
    surgicalApproach: { laparoscopic: 88, open: 12 } // percentages
  }
};
