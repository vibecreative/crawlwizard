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
      ai_credit_usage: {
        Row: {
          action_type: string
          created_at: string
          credits_used: number
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_used?: number
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_used?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_ranking_checks: {
        Row: {
          created_at: string
          domain: string
          id: string
          page_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          page_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          page_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_ranking_checks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_ranking_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_ranking_results: {
        Row: {
          ai_response: string | null
          check_id: string
          created_at: string
          id: string
          is_mentioned: boolean | null
          mention_position: number | null
          model: string
          question: string
          sentiment: string | null
        }
        Insert: {
          ai_response?: string | null
          check_id: string
          created_at?: string
          id?: string
          is_mentioned?: boolean | null
          mention_position?: number | null
          model: string
          question: string
          sentiment?: string | null
        }
        Update: {
          ai_response?: string | null
          check_id?: string
          created_at?: string
          id?: string
          is_mentioned?: boolean | null
          mention_position?: number | null
          model?: string
          question?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_ranking_results_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "ai_ranking_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          plan: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          plan?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_brand_knowledge: {
        Row: {
          avoided_terms: string | null
          company_description: string | null
          created_at: string
          example_texts: string | null
          id: string
          key_messages: string | null
          preferred_terms: string | null
          project_id: string
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string
          usps: string | null
        }
        Insert: {
          avoided_terms?: string | null
          company_description?: string | null
          created_at?: string
          example_texts?: string | null
          id?: string
          key_messages?: string | null
          preferred_terms?: string | null
          project_id: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          usps?: string | null
        }
        Update: {
          avoided_terms?: string | null
          company_description?: string | null
          created_at?: string
          example_texts?: string | null
          id?: string
          key_messages?: string | null
          preferred_terms?: string | null
          project_id?: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          usps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_brand_knowledge_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pages: {
        Row: {
          analysis_data: Json | null
          created_at: string
          error_message: string | null
          has_h1: boolean | null
          has_meta_description: boolean | null
          has_structured_data: boolean | null
          heading_issues: number | null
          id: string
          keyword_issues: number | null
          meta_description: string | null
          position: number | null
          project_id: string
          seo_score: number | null
          status: string
          structured_data_issues: number | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          error_message?: string | null
          has_h1?: boolean | null
          has_meta_description?: boolean | null
          has_structured_data?: boolean | null
          heading_issues?: number | null
          id?: string
          keyword_issues?: number | null
          meta_description?: string | null
          position?: number | null
          project_id: string
          seo_score?: number | null
          status?: string
          structured_data_issues?: number | null
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          error_message?: string | null
          has_h1?: boolean | null
          has_meta_description?: boolean | null
          has_structured_data?: boolean | null
          heading_issues?: number | null
          id?: string
          keyword_issues?: number | null
          meta_description?: string | null
          position?: number | null
          project_id?: string
          seo_score?: number | null
          status?: string
          structured_data_issues?: number | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          analyzed_pages: number | null
          base_url: string
          created_at: string
          id: string
          name: string
          status: string
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyzed_pages?: number | null
          base_url: string
          created_at?: string
          id?: string
          name: string
          status?: string
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyzed_pages?: number | null
          base_url?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_remaining_credits: { Args: { _user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_own_profile: {
        Args: { _company_name?: string; _full_name?: string }
        Returns: undefined
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
