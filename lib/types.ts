export type Subtopic = {
  number: string;   // e.g. "1.1"
  title: string;
  content: string;
  audio_url?: string | null;
};

export type Unit = {
  slug: string;             // subject slug this unit belongs to
  subject: string;          // raw subject name from source
  unit_label: string;       // "Unit 1"
  unit_number: string;      // "1"
  unit_title: string;
  learning_outcomes_raw: string;
  subtopics: Subtopic[];
  summary: string;
  keywords: string;
  self_assessment_questions: string;
  references: string;
  raw_text: string;
};

export type Subject = {
  slug: string;
  name: string;
  order: number;
};

export type SubtopicProgressStatus = "unread" | "read" | "practiced";

export type ProgressMap = {
  // key: `${subjectSlug}:${unitNumber}:${subtopicNumber}`
  [key: string]: SubtopicProgressStatus;
};

export type StreakState = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null; // ISO date, YYYY-MM-DD
};

export type LastVisited = {
  subjectSlug: string;
  subjectName: string;
  unitNumber: string;
  subtopicNumber: string;
  subtopicTitle: string;
  visitedAt: string; // ISO timestamp
};

export type DayActivity = {
  read: number;
  practiced: number;
  asked: number;
};

export type DailyLog = {
  // key: ISO date, YYYY-MM-DD
  [date: string]: DayActivity;
};

export type SubjectWithSubtopics = {
  slug: string;
  name: string;
  order: number;
  unitNumber: string;
  unitLabel: string;
  unitTitle: string;
  subtopics: Subtopic[];
};

export type NextUp = {
  subjectSlug: string;
  subjectName: string;
  unitNumber: string;
  subtopicNumber: string;
  subtopicTitle: string;
};
