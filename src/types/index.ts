export interface Resource {
  id: string;
  categoryId: string;
  examSeriesId?: string;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  sourceType: 'youtube' | 'google_drive' | 'external_link';
  sourceUrl: string;
  topic?: string;
  subject: string;
  year?: number;
  session?: string;
  variant?: number;
  isWatermarked: boolean;
  isLocked: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
}

export interface ResourceSolution {
  id: string;
  paperId: string;
  videoId: string;
  questionNumber: number;
  timestampSeconds: number;
  label: string;
  sortOrder: number;
}

export interface Level {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  levelId: string;
  slug: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  parentId?: string;
  sortOrder: number;
}

export interface ExamSeries {
  id: string;
  subjectId: string;
  code: string;
  year: number;
  session: string;
  variant: number;
  paperNumber: number;
}

export interface Subscriber {
  id: string;
  email: string;
  sourcePage: string;
  level: string;
  isActive: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
