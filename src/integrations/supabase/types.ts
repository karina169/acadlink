export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      campus_news: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          pinned: boolean
          published_by: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_by: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message_type: string
          reply_to: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      course_members: {
        Row: {
          course_id: string
          id: string
          joined_at: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_members_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          avatar_url: string | null
          code: string
          created_at: string
          department_id: string | null
          display_name: string | null
          faculty_id: string | null
          id: string
          level: string
          scope: string
          semester: string
          title: string
          units: number
        }
        Insert: {
          avatar_url?: string | null
          code: string
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          faculty_id?: string | null
          id?: string
          level: string
          scope?: string
          semester?: string
          title: string
          units?: number
        }
        Update: {
          avatar_url?: string | null
          code?: string
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          faculty_id?: string | null
          id?: string
          level?: string
          scope?: string
          semester?: string
          title?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      handouts: {
        Row: {
          course_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          file_name: string
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          level: string | null
          target_departments: string[]
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name: string
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          level?: string | null
          target_departments?: string[]
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          level?: string | null
          target_departments?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "handouts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handouts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      past_questions: {
        Row: {
          course_id: string | null
          created_at: string
          department_id: string | null
          downloads: number
          file_name: string
          file_url: string
          id: string
          level: string | null
          pages: number | null
          semester: string | null
          session: string | null
          target_departments: string[]
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          department_id?: string | null
          downloads?: number
          file_name: string
          file_url: string
          id?: string
          level?: string | null
          pages?: number | null
          semester?: string | null
          session?: string | null
          target_departments?: string[]
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          department_id?: string | null
          downloads?: number
          file_name?: string
          file_url?: string
          id?: string
          level?: string | null
          pages?: number | null
          semester?: string | null
          session?: string | null
          target_departments?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "past_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "past_questions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          boosted_until: string | null
          content: string
          created_at: string
          id: string
          tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boosted_until?: string | null
          content: string
          created_at?: string
          id?: string
          tag?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boosted_until?: string | null
          content?: string
          created_at?: string
          id?: string
          tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          boosted_until: string | null
          created_at: string
          department: string | null
          display_name: string | null
          faculty: string | null
          feature_overrides: Json
          id: string
          level: string | null
          matric_number: string | null
          title: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          boosted_until?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          faculty?: string | null
          feature_overrides?: Json
          id?: string
          level?: string | null
          matric_number?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          boosted_until?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          faculty?: string | null
          feature_overrides?: Json
          id?: string
          level?: string | null
          matric_number?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      signup_invites: {
        Row: {
          account_type: string
          active: boolean
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          label: string | null
          max_uses: number | null
          single_use: boolean
          token: string
          updated_at: string
          uses: number
        }
        Insert: {
          account_type?: string
          active?: boolean
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number | null
          single_use?: boolean
          token: string
          updated_at?: string
          uses?: number
        }
        Update: {
          account_type?: string
          active?: boolean
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number | null
          single_use?: boolean
          token?: string
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      student_results: {
        Row: {
          course_code: string
          course_id: string | null
          course_title: string | null
          created_at: string
          grade: string
          id: string
          score: number | null
          semester: string
          session: string
          student_id: string
          units: number
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          course_code: string
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          grade: string
          id?: string
          score?: number | null
          semester: string
          session: string
          student_id: string
          units?: number
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          course_code?: string
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          grade?: string
          id?: string
          score?: number | null
          semester?: string
          session?: string
          student_id?: string
          units?: number
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          announcement_banner: string | null
          banner_ends_at: string | null
          banner_starts_at: string | null
          banner_variant: string
          default_post_tag: string
          id: boolean
          live_events_enabled: boolean
          max_post_length: number
          reels_enabled: boolean
          registration_open: boolean
          site_name: string
          tagline: string
          updated_at: string
          voice_notes_enabled: boolean
        }
        Insert: {
          announcement_banner?: string | null
          banner_ends_at?: string | null
          banner_starts_at?: string | null
          banner_variant?: string
          default_post_tag?: string
          id?: boolean
          live_events_enabled?: boolean
          max_post_length?: number
          reels_enabled?: boolean
          registration_open?: boolean
          site_name?: string
          tagline?: string
          updated_at?: string
          voice_notes_enabled?: boolean
        }
        Update: {
          announcement_banner?: string | null
          banner_ends_at?: string | null
          banner_starts_at?: string | null
          banner_variant?: string
          default_post_tag?: string
          id?: boolean
          live_events_enabled?: boolean
          max_post_length?: number
          reels_enabled?: boolean
          registration_open?: boolean
          site_name?: string
          tagline?: string
          updated_at?: string
          voice_notes_enabled?: boolean
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_title: string | null
          created_at: string
          created_by: string
          day_of_week: string
          department_id: string | null
          end_time: string
          id: string
          lecturer: string | null
          level: string | null
          semester: string
          start_time: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          course_code?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by: string
          day_of_week: string
          department_id?: string | null
          end_time: string
          id?: string
          lecturer?: string | null
          level?: string | null
          semester?: string
          start_time: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          course_code?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by?: string
          day_of_week?: string
          department_id?: string | null
          end_time?: string
          id?: string
          lecturer?: string | null
          level?: string | null
          semester?: string
          start_time?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          department: string | null
          evidence_url: string | null
          full_name: string
          id: string
          level: string | null
          matric_number: string | null
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          evidence_url?: string | null
          full_name: string
          id?: string
          level?: string | null
          matric_number?: string | null
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          evidence_url?: string | null
          full_name?: string
          id?: string
          level?: string | null
          matric_number?: string | null
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "group_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "group_admin", "user"],
    },
  },
} as const
