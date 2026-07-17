export type Note = { id: string; title: string; subject: string; source: string; content: string; createdAt: string };
export const notes: Note[] = [
  { id: '1', title: 'Cellular Respiration', subject: 'Biology', source: 'Lecture notes', content: 'Glycolysis takes place in the cytoplasm and breaks glucose into pyruvate. The Krebs cycle occurs in the mitochondrial matrix, while the electron transport chain is located on the inner mitochondrial membrane.', createdAt: 'Today' },
  { id: '2', title: 'Research Methods', subject: 'Psychology', source: 'Pasted text', content: 'A controlled experiment changes one independent variable while measuring a dependent variable. Random assignment helps balance participant differences between groups.', createdAt: 'Yesterday' },
  { id: '3', title: 'Organic Chemistry — Week 4', subject: 'Chemistry', source: 'Scanned page', content: 'Nucleophiles donate an electron pair to an electrophile. Curved arrows show the movement of electron pairs during a reaction mechanism.', createdAt: 'May 12' },
];
export const deadlines = [
  { id: '1', title: 'Biology midterm', subject: 'Biology', date: 'May 18', days: 3, urgency: 'this week' },
  { id: '2', title: 'Research essay', subject: 'Psychology', date: 'May 25', days: 10, urgency: 'soon' },
];
