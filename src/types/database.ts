export interface TutorRecord {
  id: string;
  full_name: string;
  slug: string;
  thumbnail_url: string | null;
  hook_intro: string | null;
  detailed_bio: string | null;
  video_intro_url: string | null;
  video_demo_url: string | null;
  specialties: string[];
  locations: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentAccountTutorAssignment {
  id: string;
  tutor_id: string | null;
}

export interface AppDatabaseTables {
  tutors: TutorRecord;
  student_accounts: StudentAccountTutorAssignment;
}
