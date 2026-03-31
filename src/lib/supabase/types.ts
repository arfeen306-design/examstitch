/**
 * Database type definitions — generated from the ExamStitch schema.
 * These types keep Supabase queries fully type-safe.
 * Re-run `supabase gen types typescript` after any schema change.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      levels: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['levels']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['levels']['Row']>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          level_id: string;
          slug: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['subjects']['Row']>;
      };
      categories: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
      };
      exam_series: {
        Row: {
          id: string;
          subject_id: string;
          code: string;
          year: number;
          session: string;
          variant: number;
          paper_number: number;
        };
        Insert: Omit<Database['public']['Tables']['exam_series']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['exam_series']['Row']>;
      };
      resources: {
        Row: {
          id: string;
          category_id: string;
          exam_series_id: string | null;
          title: string;
          description: string | null;
          content_type: 'video' | 'pdf' | 'worksheet';
          source_type: 'youtube' | 'google_drive' | 'external_link';
          source_url: string;
          topic: string | null;
          subject: string;
          is_watermarked: boolean;
          is_locked: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resources']['Row']>;
      };
      resource_solutions: {
        Row: {
          id: string;
          paper_id: string;
          video_id: string;
          question_number: number;
          timestamp_seconds: number;
          label: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['resource_solutions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['resource_solutions']['Row']>;
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          source_page: string;
          level: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscribers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subscribers']['Row']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'tutor_verified' | 'tutor_pending' | 'student' | 'public';
          avatar_url: string | null;
          bio: string | null;
          subjects: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      tutor_applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          subjects: string[];
          qualifications: string | null;
          experience: string | null;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tutor_applications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tutor_applications']['Row']>;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          author_id: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_posts']['Row']>;
      };
      demo_bookings: {
        Row: {
          id: string;
          booking_ref: string;
          name: string;
          whatsapp: string;
          level: string;
          subject: string;
          status: 'pending' | 'contacted' | 'booked' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['demo_bookings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['demo_bookings']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_type: 'video' | 'pdf' | 'worksheet';
      source_type: 'youtube' | 'google_drive' | 'external_link';
      user_role: 'admin' | 'tutor_verified' | 'tutor_pending' | 'student' | 'public';
      application_status: 'pending' | 'approved' | 'rejected';
    };
  };
};

// Convenience row types
export type Level = Database['public']['Tables']['levels']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type ExamSeries = Database['public']['Tables']['exam_series']['Row'];
export type Resource = Database['public']['Tables']['resources']['Row'];
export type ResourceSolution = Database['public']['Tables']['resource_solutions']['Row'];
export type Subscriber = Database['public']['Tables']['subscribers']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type DemoBooking = Database['public']['Tables']['demo_bookings']['Row'];
