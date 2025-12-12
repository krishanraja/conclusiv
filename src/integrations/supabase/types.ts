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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          device_info: Json | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page: string | null
          session_id: string
          step: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page?: string | null
          session_id: string
          step?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page?: string | null
          session_id?: string
          step?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          ended_at: string | null
          id: string
          pages_viewed: number | null
          referrer: string | null
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          ended_at?: string | null
          id?: string
          pages_viewed?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          ended_at?: string | null
          id?: string
          pages_viewed?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      company_brain: {
        Row: {
          company_name: string | null
          created_at: string | null
          emphasized_topics: string[] | null
          historical_themes: Json | null
          id: string
          narratives_count: number | null
          strategic_guardrails: string[] | null
          tone_patterns: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          emphasized_topics?: string[] | null
          historical_themes?: Json | null
          id?: string
          narratives_count?: number | null
          strategic_guardrails?: string[] | null
          tone_patterns?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          emphasized_topics?: string[] | null
          historical_themes?: Json | null
          id?: string
          narratives_count?: number | null
          strategic_guardrails?: string[] | null
          tone_patterns?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          category: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          context: Json | null
          created_at: string
          feedback_type: string
          id: string
          message: string | null
          page: string | null
          rating: number | null
          sentiment: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          feedback_type: string
          id?: string
          message?: string | null
          page?: string | null
          rating?: number | null
          sentiment?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string | null
          page?: string | null
          rating?: number | null
          sentiment?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      narrative_comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          narrative_id: string | null
          parent_id: string | null
          section_id: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          narrative_id?: string | null
          parent_id?: string | null
          section_id?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          narrative_id?: string | null
          parent_id?: string | null
          section_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_comments_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "narrative_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      narratives: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          narrative_data: Json
          share_id: string | null
          share_password: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          narrative_data: Json
          share_id?: string | null
          share_password?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          narrative_data?: Json
          share_id?: string | null
          share_password?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      presentation_analytics: {
        Row: {
          created_at: string | null
          device_info: Json | null
          event_type: string
          id: string
          narrative_id: string | null
          section_index: number | null
          session_id: string
          share_id: string
          time_spent_seconds: number | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          event_type: string
          id?: string
          narrative_id?: string | null
          section_index?: number | null
          session_id: string
          share_id: string
          time_spent_seconds?: number | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          event_type?: string
          id?: string
          narrative_id?: string | null
          section_index?: number | null
          session_id?: string
          share_id?: string
          time_spent_seconds?: number | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_analytics_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
        ]
      }
      presenter_notes: {
        Row: {
          created_at: string | null
          id: string
          narrative_id: string | null
          notes: string
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          narrative_id?: string | null
          notes: string
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          narrative_id?: string | null
          notes?: string
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presenter_notes_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_logo_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          updated_at: string | null
        }
        Insert: {
          company_logo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          updated_at?: string | null
        }
        Update: {
          company_logo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      research_history: {
        Row: {
          audience: string | null
          created_at: string | null
          decision_type: string | null
          id: string
          query: string
          results: Json | null
          subject: string | null
          user_id: string
        }
        Insert: {
          audience?: string | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          query: string
          results?: Json | null
          subject?: string | null
          user_id: string
        }
        Update: {
          audience?: string | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          query?: string
          results?: Json | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      research_templates: {
        Row: {
          audience: string | null
          created_at: string | null
          decision_type: string
          id: string
          industry: string | null
          known_concerns_template: string | null
          name: string
          primary_question_template: string | null
          red_flags_template: string | null
          success_criteria_template: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audience?: string | null
          created_at?: string | null
          decision_type: string
          id?: string
          industry?: string | null
          known_concerns_template?: string | null
          name: string
          primary_question_template?: string | null
          red_flags_template?: string | null
          success_criteria_template?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audience?: string | null
          created_at?: string | null
          decision_type?: string
          id?: string
          industry?: string | null
          known_concerns_template?: string | null
          name?: string
          primary_question_template?: string | null
          red_flags_template?: string | null
          success_criteria_template?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage: {
        Row: {
          builds_count: number | null
          created_at: string | null
          id: string
          last_build_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          builds_count?: number | null
          created_at?: string | null
          id?: string
          last_build_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          builds_count?: number | null
          created_at?: string | null
          id?: string
          last_build_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
